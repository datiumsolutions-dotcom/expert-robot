import { adminRepository } from './admin.repository';
import type { AdminUser } from '@loyalty/db';

export const adminsService = {
  listUsers: (orgId: string, opts: { limit: number; offset: number }) =>
    adminRepository.findAll(orgId, opts),

  getUser: (orgId: string, id: string) =>
    adminRepository.findById(orgId, id),

  createUser: (orgId: string, data: Record<string, unknown>) =>
    adminRepository.create(orgId, data as Partial<AdminUser>),

  updateUser: (orgId: string, id: string, data: Record<string, unknown>) =>
    adminRepository.update(orgId, id, data as Partial<AdminUser>),

  deleteUser: (orgId: string, id: string) =>
    adminRepository.delete(orgId, id),
};
