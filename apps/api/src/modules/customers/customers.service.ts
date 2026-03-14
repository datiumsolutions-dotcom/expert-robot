import { customersRepository } from './customers.repository';
import type { LoyaltyCustomer } from '@loyalty/db';

export const customersService = {
  list: (orgId: string, opts: { limit: number; offset: number }) =>
    customersRepository.findAll(orgId, opts),

  getById: (orgId: string, id: string) =>
    customersRepository.findById(orgId, id),

  create: (orgId: string, data: Record<string, unknown>) =>
    customersRepository.create(orgId, data as Partial<LoyaltyCustomer>),

  update: (orgId: string, id: string, data: Record<string, unknown>) =>
    customersRepository.update(orgId, id, data as Partial<LoyaltyCustomer>),

  remove: (orgId: string, id: string) =>
    customersRepository.delete(orgId, id),

  getTransactions: (orgId: string, customerId: string, opts: { limit: number; offset: number }) =>
    customersRepository.findTransactions(orgId, customerId, opts),
};
