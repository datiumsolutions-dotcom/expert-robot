import { prisma } from '@loyalty/db/src/client';
import type { RewardRedemption } from '@loyalty/db';
import { NotFoundError } from '@loyalty/utils';

export const redemptionsRepository = {
  async findAll(orgId: string, opts: { limit: number; offset: number }) {
    const [data, total] = await Promise.all([
      prisma.rewardRedemption.findMany({
        where: { organization_id: orgId },
        skip: opts.offset, take: opts.limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.rewardRedemption.count({ where: { organization_id: orgId } }),
    ]);
    return { data, total };
  },

  async findById(orgId: string, id: string): Promise<RewardRedemption> {
    const r = await prisma.rewardRedemption.findFirst({ where: { id, organization_id: orgId } });
    if (!r) throw new NotFoundError('RewardRedemption', id);
    return r;
  },

  async create(orgId: string, data: Partial<RewardRedemption>): Promise<RewardRedemption> {
    return prisma.rewardRedemption.create({ data: { ...data as RewardRedemption, organization_id: orgId } });
  },

  async cancel(orgId: string, id: string): Promise<RewardRedemption> {
    const r = await prisma.rewardRedemption.findFirst({ where: { id, organization_id: orgId } });
    if (!r) throw new NotFoundError('RewardRedemption', id);
    return prisma.rewardRedemption.update({ where: { id }, data: { status: 'cancelled' } });
  },
};
