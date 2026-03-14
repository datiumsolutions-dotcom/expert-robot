import { auditRepository } from './audit.repository';
import type { AuditLog } from '@loyalty/db';

export const auditService = {
  list: (orgId: string, opts: { limit: number; offset: number }) => auditRepository.findAll(orgId, opts),
  getById: (orgId: string, id: string) => auditRepository.findById(orgId, id),
  log: (data: Partial<AuditLog>) => auditRepository.append(data),
};
