import type { Request, Response, NextFunction } from 'express';
import { customersService } from './customers.service';
import { successResponse, parsePagination } from '@loyalty/utils';

export const customersController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const { data, total } = await customersService.list(req.orgId!, { limit, offset });
      res.json(successResponse(data, { page, limit, total }));
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customersService.getById(req.orgId!, req.params['id']!);
      res.json(successResponse(customer));
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customersService.create(req.orgId!, req.body as Record<string, unknown>);
      res.status(201).json(successResponse(customer));
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customersService.update(req.orgId!, req.params['id']!, req.body as Record<string, unknown>);
      res.json(successResponse(customer));
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await customersService.remove(req.orgId!, req.params['id']!);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const { data, total } = await customersService.getTransactions(req.orgId!, req.params['id']!, { limit, offset });
      res.json(successResponse(data, { page, limit, total }));
    } catch (err) { next(err); }
  },
};
