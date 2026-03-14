import { redemptionsRepository } from './redemptions.repository';
import type { RewardRedemption } from '@loyalty/db';

export const redemptionsService = {
  list: (orgId: string, opts: { limit: number; offset: number }) => redemptionsRepository.findAll(orgId, opts),
  getById: (orgId: string, id: string) => redemptionsRepository.findById(orgId, id),
  create: (orgId: string, data: Record<string, unknown>) => redemptionsRepository.create(orgId, data as Partial<RewardRedemption>),
  cancel: (orgId: string, id: string) => redemptionsRepository.cancel(orgId, id),
};
