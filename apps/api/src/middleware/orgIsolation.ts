import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '@loyalty/utils';

/**
 * Extracts organization_id from the authenticated JWT payload and
 * injects it into req.orgId. Must run AFTER the authenticate middleware.
 */
export function orgIsolation(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user?.org) {
    return next(new ForbiddenError('Organization context is missing from token'));
  }
  req.orgId = req.user.org;
  next();
}
