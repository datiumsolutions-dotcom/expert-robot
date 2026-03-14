import type { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service';
import { successResponse, parsePagination } from '@loyalty/utils';

export const ordersController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const { data, total } = await ordersService.list(req.orgId!, { limit, offset });
      res.json(successResponse(data, { page, limit, total }));
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await ordersService.getById(req.orgId!, req.params['id']!);
      res.json(successResponse(order));
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await ordersService.create(req.orgId!, req.body as Record<string, unknown>);
      res.status(201).json(successResponse(order));
    } catch (err) { next(err); }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body as { status: string };
      const order = await ordersService.updateStatus(req.orgId!, req.params['id']!, status);
      res.json(successResponse(order));
    } catch (err) { next(err); }
  },
};
