import { db } from '@loyalty/db';
import type { Prisma } from '@prisma/client';
import { assignPointsForOrder, reversePointsForOrder, redeemPoints } from './points.engine';

export const pointsService = {
  async assignForOrder(orgId: string, orderId: string, customerId: string, totalAmount: number) {
    const org = await db.organization.findUnique({ where: { id: orgId }, select: { settings: true } });
    const amountPerPoint = Number((org?.settings as Record<string, unknown> | undefined)?.['amount_per_point'] ?? 10000);

    return db.$transaction(async (tx: Prisma.TransactionClient) =>
      assignPointsForOrder(tx, orgId, orderId, customerId, totalAmount, amountPerPoint),
    );
  },

  async reverseForOrder(orgId: string, orderId: string) {
    return db.$transaction(async (tx: Prisma.TransactionClient) => reversePointsForOrder(tx, orgId, orderId));
  },

  async fulfillRedemption(orgId: string, redemptionId: string, adminId: string) {
    return db.$transaction(async (tx: Prisma.TransactionClient) => redeemPoints(tx, orgId, redemptionId, adminId));
  },
};
