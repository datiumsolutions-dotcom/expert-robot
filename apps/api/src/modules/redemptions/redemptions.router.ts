import { Router } from 'express';
import { redemptionsController } from './redemptions.controller';

export const redemptionsRouter = Router();

// GET /api/v1/redemptions
redemptionsRouter.get('/', redemptionsController.list);

// GET /api/v1/redemptions/:id
redemptionsRouter.get('/:id', redemptionsController.getById);

// POST /api/v1/redemptions
redemptionsRouter.post('/', redemptionsController.create);

// PATCH /api/v1/redemptions/:id/cancel
redemptionsRouter.patch('/:id/cancel', redemptionsController.cancel);
