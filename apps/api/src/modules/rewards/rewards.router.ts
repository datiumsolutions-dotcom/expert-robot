import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { rewardsController } from './rewards.controller';

export const rewardsRouter: ExpressRouter = Router();

// GET /api/v1/rewards
rewardsRouter.get('/', rewardsController.list);

// GET /api/v1/rewards/:id
rewardsRouter.get('/:id', rewardsController.getById);

// POST /api/v1/rewards
rewardsRouter.post('/', rewardsController.create);

// PATCH /api/v1/rewards/:id
rewardsRouter.patch('/:id', rewardsController.update);

// DELETE /api/v1/rewards/:id
rewardsRouter.delete('/:id', rewardsController.remove);
