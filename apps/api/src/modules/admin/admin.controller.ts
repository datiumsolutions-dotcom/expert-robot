import type { Request, Response, NextFunction } from 'express';
import { adminsService } from './admin.service';
import { successResponse, parsePagination } from '@loyalty/utils';

export const adminsController = {
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const { data, total } = await adminsService.listUsers(req.orgId!, { limit, offset });
      res.json(successResponse(data, { page, limit, total }));
    } catch (err) { next(err); }
  },

  async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await adminsService.getUser(req.orgId!, req.params['id']!);
      res.json(successResponse(user));
    } catch (err) { next(err); }
  },

  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await adminsService.createUser(req.orgId!, req.body as Record<string, unknown>);
      res.status(201).json(successResponse(user));
    } catch (err) { next(err); }
  },

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await adminsService.updateUser(req.orgId!, req.params['id']!, req.body as Record<string, unknown>);
      res.json(successResponse(user));
    } catch (err) { next(err); }
  },

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminsService.deleteUser(req.orgId!, req.params['id']!);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await adminsService.getUser(req.orgId!, req.user!.sub);
      res.json(successResponse(user));
    } catch (err) { next(err); }
  },
};
