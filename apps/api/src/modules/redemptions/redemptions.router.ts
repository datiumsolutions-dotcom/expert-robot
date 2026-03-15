import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { redemptionsController } from './redemptions.controller';

export const redemptionsRouter: ExpressRouter = Router();

// GET /api/v1/redemptions
redemptionsRouter.get('/', redemptionsController.list);

// GET /api/v1/redemptions/:id
redemptionsRouter.get('/:id', redemptionsController.getById);

// POST /api/v1/redemptions
redemptionsRouter.post('/', redemptionsController.create);

// PATCH /api/v1/redemptions/:id/cancel
redemptionsRouter.patch('/:id/cancel', redemptionsController.cancel);
