import { Router } from 'express';
import { importController } from './import.controller';

export const importRouter = Router();

// POST /api/v1/import/orders
importRouter.post('/orders', importController.importOrders);

// GET /api/v1/import/jobs
importRouter.get('/jobs', importController.listJobs);

// GET /api/v1/import/jobs/:jobId
importRouter.get('/jobs/:jobId', importController.getJob);
