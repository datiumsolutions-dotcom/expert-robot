import { prisma } from '@loyalty/db/src/client';
import type { LoyaltyOrder } from '@loyalty/db';
import { NotFoundError } from '@loyalty/utils';

export const ordersRepository = {
  async findAll(orgId: string, opts: { limit: number; offset: number }) {
    const [data, total] = await Promise.all([
      prisma.loyaltyOrder.findMany({
        where: { organization_id: orgId },
        skip: opts.offset, take: opts.limit,
        orderBy: { order_date: 'desc' },
      }),
      prisma.loyaltyOrder.count({ where: { organization_id: orgId } }),
    ]);
    return { data, total };
  },

  async findById(orgId: string, id: string): Promise<LoyaltyOrder> {
    const o = await prisma.loyaltyOrder.findFirst({ where: { id, organization_id: orgId } });
    if (!o) throw new NotFoundError('LoyaltyOrder', id);
    return o;
  },

  async create(orgId: string, data: Partial<LoyaltyOrder>): Promise<LoyaltyOrder> {
    return prisma.loyaltyOrder.create({ data: { ...data as LoyaltyOrder, organization_id: orgId } });
  },

  async updateStatus(orgId: string, id: string, status: string): Promise<LoyaltyOrder> {
    const o = await prisma.loyaltyOrder.findFirst({ where: { id, organization_id: orgId } });
    if (!o) throw new NotFoundError('LoyaltyOrder', id);
    return prisma.loyaltyOrder.update({ where: { id }, data: { status: status as LoyaltyOrder['status'] } });
  },
};
