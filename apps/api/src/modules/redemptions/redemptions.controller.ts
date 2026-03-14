import type { Request, Response, NextFunction } from 'express';
import { redemptionsService } from './redemptions.service';
import { successResponse, parsePagination } from '@loyalty/utils';

export const redemptionsController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const { data, total } = await redemptionsService.list(req.orgId!, { limit, offset });
      res.json(successResponse(data, { page, limit, total }));
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const r = await redemptionsService.getById(req.orgId!, req.params['id']!);
      res.json(successResponse(r));
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const r = await redemptionsService.create(req.orgId!, req.body as Record<string, unknown>);
      res.status(201).json(successResponse(r));
    } catch (err) { next(err); }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const r = await redemptionsService.cancel(req.orgId!, req.params['id']!);
      res.json(successResponse(r));
    } catch (err) { next(err); }
  },
};
