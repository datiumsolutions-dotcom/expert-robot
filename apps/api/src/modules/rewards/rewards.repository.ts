import { prisma } from '@loyalty/db/src/client';
import type { LoyaltyReward } from '@loyalty/db';
import { NotFoundError } from '@loyalty/utils';

export const rewardsRepository = {
  async findAll(orgId: string, opts: { limit: number; offset: number }) {
    const [data, total] = await Promise.all([
      prisma.loyaltyReward.findMany({
        where: { organization_id: orgId },
        skip: opts.offset, take: opts.limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.loyaltyReward.count({ where: { organization_id: orgId } }),
    ]);
    return { data, total };
  },

  async findById(orgId: string, id: string): Promise<LoyaltyReward> {
    const r = await prisma.loyaltyReward.findFirst({ where: { id, organization_id: orgId } });
    if (!r) throw new NotFoundError('LoyaltyReward', id);
    return r;
  },

  async create(orgId: string, data: Partial<LoyaltyReward>): Promise<LoyaltyReward> {
    return prisma.loyaltyReward.create({ data: { ...data as LoyaltyReward, organization_id: orgId } });
  },

  async update(orgId: string, id: string, data: Partial<LoyaltyReward>): Promise<LoyaltyReward> {
    const r = await prisma.loyaltyReward.findFirst({ where: { id, organization_id: orgId } });
    if (!r) throw new NotFoundError('LoyaltyReward', id);
    return prisma.loyaltyReward.update({ where: { id }, data });
  },

  async delete(orgId: string, id: string): Promise<void> {
    const r = await prisma.loyaltyReward.findFirst({ where: { id, organization_id: orgId } });
    if (!r) throw new NotFoundError('LoyaltyReward', id);
    await prisma.loyaltyReward.update({ where: { id }, data: { is_active: false } });
  },
};
