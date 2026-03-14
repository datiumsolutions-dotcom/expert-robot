import { prisma } from '@loyalty/db/src/client';
import type { AuditLog } from '@loyalty/db';
import { NotFoundError } from '@loyalty/utils';

export const auditRepository = {
  async findAll(orgId: string, opts: { limit: number; offset: number }) {
    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { organization_id: orgId },
        skip: opts.offset, take: opts.limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.auditLog.count({ where: { organization_id: orgId } }),
    ]);
    return { data, total };
  },

  async findById(orgId: string, id: string): Promise<AuditLog> {
    const log = await prisma.auditLog.findFirst({ where: { id, organization_id: orgId } });
    if (!log) throw new NotFoundError('AuditLog', id);
    return log;
  },

  /**
   * Append a new audit log entry.
   * NOTE: No update or delete is exposed — append-only by design.
   */
  async append(data: Partial<AuditLog>): Promise<AuditLog> {
    return prisma.auditLog.create({ data: data as AuditLog });
  },
};
