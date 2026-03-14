import { Router } from 'express';
import { auditController } from './audit.controller';

export const auditRouter = Router();

// GET /api/v1/audit
auditRouter.get('/', auditController.list);

// GET /api/v1/audit/:id
auditRouter.get('/:id', auditController.getById);
