import type { Request, Response, NextFunction } from 'express';
import { importService } from './import.service';
import { successResponse } from '@loyalty/utils';

export const importController = {
  async importOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await importService.enqueueOrderImport(req.orgId!, req.body as Record<string, unknown>);
      res.status(202).json(successResponse(job));
    } catch (err) { next(err); }
  },

  async listJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobs = await importService.listJobs(req.orgId!);
      res.json(successResponse(jobs));
    } catch (err) { next(err); }
  },

  async getJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await importService.getJob(req.orgId!, req.params['jobId']!);
      res.json(successResponse(job));
    } catch (err) { next(err); }
  },
};
