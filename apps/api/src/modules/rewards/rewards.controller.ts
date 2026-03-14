import type { Request, Response, NextFunction } from 'express';
import { rewardsService } from './rewards.service';
import { successResponse, parsePagination } from '@loyalty/utils';

export const rewardsController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const { data, total } = await rewardsService.list(req.orgId!, { limit, offset });
      res.json(successResponse(data, { page, limit, total }));
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reward = await rewardsService.getById(req.orgId!, req.params['id']!);
      res.json(successResponse(reward));
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reward = await rewardsService.create(req.orgId!, req.body as Record<string, unknown>);
      res.status(201).json(successResponse(reward));
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reward = await rewardsService.update(req.orgId!, req.params['id']!, req.body as Record<string, unknown>);
      res.json(successResponse(reward));
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await rewardsService.remove(req.orgId!, req.params['id']!);
      res.status(204).send();
    } catch (err) { next(err); }
  },
};
