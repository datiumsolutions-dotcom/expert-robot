import { prisma } from '@loyalty/db/src/client';
import type { LoyaltyCustomer } from '@loyalty/db';
import { NotFoundError } from '@loyalty/utils';

export const customersRepository = {
  async findAll(orgId: string, opts: { limit: number; offset: number }) {
    const [data, total] = await Promise.all([
      prisma.loyaltyCustomer.findMany({
        where: { organization_id: orgId },
        skip: opts.offset,
        take: opts.limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.loyaltyCustomer.count({ where: { organization_id: orgId } }),
    ]);
    return { data, total };
  },

  async findById(orgId: string, id: string): Promise<LoyaltyCustomer> {
    const c = await prisma.loyaltyCustomer.findFirst({ where: { id, organization_id: orgId } });
    if (!c) throw new NotFoundError('LoyaltyCustomer', id);
    return c;
  },

  async create(orgId: string, data: Partial<LoyaltyCustomer>): Promise<LoyaltyCustomer> {
    return prisma.loyaltyCustomer.create({ data: { ...data as LoyaltyCustomer, organization_id: orgId } });
  },

  async update(orgId: string, id: string, data: Partial<LoyaltyCustomer>): Promise<LoyaltyCustomer> {
    const c = await prisma.loyaltyCustomer.findFirst({ where: { id, organization_id: orgId } });
    if (!c) throw new NotFoundError('LoyaltyCustomer', id);
    return prisma.loyaltyCustomer.update({ where: { id }, data });
  },

  async delete(orgId: string, id: string): Promise<void> {
    const c = await prisma.loyaltyCustomer.findFirst({ where: { id, organization_id: orgId } });
    if (!c) throw new NotFoundError('LoyaltyCustomer', id);
    await prisma.loyaltyCustomer.update({ where: { id }, data: { is_active: false } });
  },

  async findTransactions(orgId: string, customerId: string, opts: { limit: number; offset: number }) {
    const [data, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where: { organization_id: orgId, customer_id: customerId },
        skip: opts.offset,
        take: opts.limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.loyaltyTransaction.count({ where: { organization_id: orgId, customer_id: customerId } }),
    ]);
    return { data, total };
  },
};
