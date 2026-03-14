import type { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';
import { successResponse, parsePagination } from '@loyalty/utils';

export const auditController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const { data, total } = await auditService.list(req.orgId!, { limit, offset });
      res.json(successResponse(data, { page, limit, total }));
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await auditService.getById(req.orgId!, req.params['id']!);
      res.json(successResponse(log));
    } catch (err) { next(err); }
  },
};
