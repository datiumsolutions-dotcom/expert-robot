import type { Request, Response, NextFunction } from 'express';
import { verifyAdminToken } from '@loyalty/utils';
import { UnauthorizedError } from '@loyalty/utils';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }
    const token = authHeader.slice(7);
    const payload = verifyAdminToken(token);
    req.user = payload;
    next();
  } catch (_err) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
