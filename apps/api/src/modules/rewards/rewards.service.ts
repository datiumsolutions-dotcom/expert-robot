import { rewardsRepository } from './rewards.repository';
import type { LoyaltyReward } from '@loyalty/db';

export const rewardsService = {
  list: (orgId: string, opts: { limit: number; offset: number }) => rewardsRepository.findAll(orgId, opts),
  getById: (orgId: string, id: string) => rewardsRepository.findById(orgId, id),
  create: (orgId: string, data: Record<string, unknown>) => rewardsRepository.create(orgId, data as Partial<LoyaltyReward>),
  update: (orgId: string, id: string, data: Record<string, unknown>) => rewardsRepository.update(orgId, id, data as Partial<LoyaltyReward>),
  remove: (orgId: string, id: string) => rewardsRepository.delete(orgId, id),
};
