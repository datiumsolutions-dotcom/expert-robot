import { ordersRepository } from './orders.repository';
import type { LoyaltyOrder } from '@loyalty/db';

export const ordersService = {
  list: (orgId: string, opts: { limit: number; offset: number }) => ordersRepository.findAll(orgId, opts),
  getById: (orgId: string, id: string) => ordersRepository.findById(orgId, id),
  create: (orgId: string, data: Record<string, unknown>) => ordersRepository.create(orgId, data as Partial<LoyaltyOrder>),
  updateStatus: (orgId: string, id: string, status: string) => ordersRepository.updateStatus(orgId, id, status),
};
