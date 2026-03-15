import type { PrismaClient, Prisma } from '@prisma/client';
import { parseCsvBuffer, parseAmount, parseSaleDate, mapOrderStatus, mapSaleType, normalizeEmail, normalizePhone } from '@loyalty/utils';
import { assignPointsForOrder, reversePointsForOrder, calculatePoints as calculatePointsEngine } from '../points/points.engine';

export interface ImportReport {
  total_rows: number;
  inserted: number;
  skipped_duplicate: number;
  matched: number;
  unmatched: number;
  points_assigned: number;
  cancelled_reversed: number;
  errors: Array<{ row: number; external_order_id?: string; error: string }>;
}

export function calculatePoints(totalAmount: number, amountPerPoint: number): number {
  return calculatePointsEngine(totalAmount, amountPerPoint);
}

export async function processImport(prisma: PrismaClient, orgId: string, csvBuffer: Buffer): Promise<ImportReport> {
  const parsed = parseCsvBuffer(csvBuffer);
  const report: ImportReport = {
    total_rows: parsed.rows.length,
    inserted: 0,
    skipped_duplicate: 0,
    matched: 0,
    unmatched: 0,
    points_assigned: 0,
    cancelled_reversed: 0,
    errors: parsed.errors.map((error: string) => ({ row: 0, error })),
  };

  if (parsed.errors.length > 0) {
    await prisma.auditLog.create({
      data: {
        organization_id: orgId,
        action: 'import.completed',
        resource_type: 'import',
        new_value: report,
      },
    });
    return report;
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { settings: true } });
  const settings = (org?.settings ?? {}) as Record<string, unknown>;
  const amountPerPoint = Number(settings['amount_per_point'] ?? 10000);
  const countryCode = String(settings['country_code'] ?? '54');
  const areaCode = String(settings['area_code'] ?? '');

  for (let index = 0; index < parsed.rows.length; index += 1) {
    const row = parsed.rows[index]!;
    const rowNumber = index + 2;
    const externalOrderId = row.Id?.trim();

    try {
      const orderDate = parseSaleDate(row.Fecha);
      const totalAmount = parseAmount(row.Total);
      const status = mapOrderStatus(row.Estado);
      const saleType = mapSaleType(row['Tipo de Venta']);
      const externalCustomerId = row['Id. Cliente']?.trim() || null;
      const phone = normalizePhone(row['Teléfono del Cliente'], countryCode, areaCode);
      const email = normalizeEmail(row['Email del Cliente']);

      if (!externalOrderId) throw new Error('Missing order Id');
      if (!orderDate) throw new Error('Invalid sale date');
      if (totalAmount === null) throw new Error('Invalid total amount');

      const existingOrder = await prisma.loyaltyOrder.findFirst({
        where: { organization_id: orgId, external_order_id: externalOrderId },
      });

      if (existingOrder) {
        report.skipped_duplicate += 1;

        if (status === 'cancelled' && existingOrder.status !== 'cancelled') {
          const reversalResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const result = await reversePointsForOrder(tx, orgId, existingOrder.id);
            await tx.loyaltyOrder.update({ where: { id: existingOrder.id }, data: { status } });
            return result;
          });

          if (!reversalResult.skipped_reason && reversalResult.points_reversed > 0) {
            report.cancelled_reversed += 1;
          }
        }

        continue;
      }

      let matchedCustomerId: string | null = null;
      let matchMethod: 'customer_id' | 'phone' | 'email' | 'unmatched' = 'unmatched';

      if (externalCustomerId) {
        const customer = await prisma.loyaltyCustomer.findFirst({
          where: { organization_id: orgId, external_id: externalCustomerId },
          select: { id: true },
        });
        if (customer) {
          matchedCustomerId = customer.id;
          matchMethod = 'customer_id';
        }
      }

      if (!matchedCustomerId && phone) {
        const customer = await prisma.loyaltyCustomer.findFirst({
          where: { organization_id: orgId, phone_number: phone },
          select: { id: true },
        });
        if (customer) {
          matchedCustomerId = customer.id;
          matchMethod = 'phone';
        }
      }

      if (!matchedCustomerId && email) {
        const customer = await prisma.loyaltyCustomer.findFirst({
          where: { organization_id: orgId, email },
          select: { id: true },
        });
        if (customer) {
          matchedCustomerId = customer.id;
          matchMethod = 'email';
        }
      }

      if (matchedCustomerId) {
        report.matched += 1;
      } else {
        report.unmatched += 1;
      }

      const createdOrder = await prisma.loyaltyOrder.create({
        data: {
          organization_id: orgId,
          external_order_id: externalOrderId,
          customer_id: matchedCustomerId,
          order_date: orderDate,
          subtotal: totalAmount,
          total_amount: totalAmount,
          status,
          source: 'import',
          raw_data: row,
          match_method: matchMethod,
        },
      });

      report.inserted += 1;

      if (status === 'completed' && matchedCustomerId) {
        const assignment = await prisma.$transaction(async (tx: Prisma.TransactionClient) =>
          assignPointsForOrder(tx, orgId, createdOrder.id, matchedCustomerId, totalAmount, amountPerPoint),
        );
        report.points_assigned += assignment.points_assigned;
      }

      if (status === 'cancelled') {
        await prisma.loyaltyOrder.update({ where: { id: createdOrder.id }, data: { points_processed_at: new Date() } });
      }

      if (!matchedCustomerId && (phone || email || externalCustomerId)) {
        const normalized = { phone, email, external_customer_id: externalCustomerId };
        await prisma.loyaltyOrder.update({ where: { id: createdOrder.id }, data: { raw_data: { ...row, normalized } } });
      }

      if (saleType) {
        await prisma.loyaltyOrder.update({ where: { id: createdOrder.id }, data: { raw_data: { ...row, sale_type: saleType } } });
      }
    } catch (error) {
      report.errors.push({
        row: rowNumber,
        external_order_id: externalOrderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      organization_id: orgId,
      action: 'import.completed',
      resource_type: 'import',
      new_value: report,
    },
  });

  return report;
}
