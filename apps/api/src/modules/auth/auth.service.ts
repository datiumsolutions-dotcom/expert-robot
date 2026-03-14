import { prisma } from '@loyalty/db/src/client';
import { signAdminToken, verifyAdminToken } from '@loyalty/utils';
import { UnauthorizedError, NotFoundError } from '@loyalty/utils';
import bcrypt from 'bcryptjs';

export const authService = {
  async login(
    email: string,
    password: string,
    organizationSlug: string,
  ): Promise<{ access_token: string; refresh_token: string; admin: object }> {
    const org = await prisma.organization.findUnique({ where: { slug: organizationSlug } });
    if (!org) throw new NotFoundError('Organization');

    const admin = await prisma.adminUser.findFirst({
      where: { organization_id: org.id, email, is_active: true },
    });
    if (!admin) throw new UnauthorizedError('Invalid credentials');

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) throw new UnauthorizedError('Invalid credentials');

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { last_login_at: new Date() },
    });

    const tokenPayload = { sub: admin.id, org: org.id, role: admin.role };
    const access_token = signAdminToken(tokenPayload, 'access');
    const refresh_token = signAdminToken(tokenPayload, 'refresh');

    const { password_hash: _ph, ...safeAdmin } = admin;
    return { access_token, refresh_token, admin: safeAdmin };
  },

  async refreshToken(
    refreshToken: string,
  ): Promise<{ access_token: string }> {
    const payload = verifyAdminToken(refreshToken);
    if (payload.type !== 'refresh') throw new UnauthorizedError('Invalid token type');

    const access_token = signAdminToken({ sub: payload.sub, org: payload.org, role: payload.role }, 'access');
    return { access_token };
  },

  async logout(): Promise<void> {
    // Stateless JWT — client-side token deletion only.
    // Future: add refresh token to a Redis blocklist here.
  },
};
