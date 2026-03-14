import { prisma } from '@loyalty/db/src/client';
import type { AdminUser } from '@loyalty/db';
import { NotFoundError } from '@loyalty/utils';

export const adminRepository = {
  async findAll(
    orgId: string,
    opts: { limit: number; offset: number },
  ): Promise<{ data: Omit<AdminUser, 'password_hash'>[]; total: number }> {
    const [data, total] = await Promise.all([
      prisma.adminUser.findMany({
        where: { organization_id: orgId },
        select: { id: true, organization_id: true, email: true, name: true, role: true, is_active: true, last_login_at: true, created_at: true, updated_at: true },
        skip: opts.offset,
        take: opts.limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.adminUser.count({ where: { organization_id: orgId } }),
    ]);
    return { data, total };
  },

  async findById(orgId: string, id: string): Promise<Omit<AdminUser, 'password_hash'>> {
    const user = await prisma.adminUser.findFirst({
      where: { id, organization_id: orgId },
      select: { id: true, organization_id: true, email: true, name: true, role: true, is_active: true, last_login_at: true, created_at: true, updated_at: true },
    });
    if (!user) throw new NotFoundError('AdminUser', id);
    return user;
  },

  async create(orgId: string, data: Partial<AdminUser>): Promise<Omit<AdminUser, 'password_hash'>> {
    const created = await prisma.adminUser.create({
      data: { ...data as AdminUser, organization_id: orgId },
      select: { id: true, organization_id: true, email: true, name: true, role: true, is_active: true, last_login_at: true, created_at: true, updated_at: true },
    });
    return created;
  },

  async update(orgId: string, id: string, data: Partial<AdminUser>): Promise<Omit<AdminUser, 'password_hash'>> {
    const user = await prisma.adminUser.findFirst({ where: { id, organization_id: orgId } });
    if (!user) throw new NotFoundError('AdminUser', id);
    const updated = await prisma.adminUser.update({
      where: { id },
      data,
      select: { id: true, organization_id: true, email: true, name: true, role: true, is_active: true, last_login_at: true, created_at: true, updated_at: true },
    });
    return updated;
  },

  async delete(orgId: string, id: string): Promise<void> {
    const user = await prisma.adminUser.findFirst({ where: { id, organization_id: orgId } });
    if (!user) throw new NotFoundError('AdminUser', id);
    await prisma.adminUser.delete({ where: { id } });
  },
};
