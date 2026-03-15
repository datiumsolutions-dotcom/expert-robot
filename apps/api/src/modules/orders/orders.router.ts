import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { ordersController } from './orders.controller';

export const ordersRouter: ExpressRouter = Router();

// GET /api/v1/orders
ordersRouter.get('/', ordersController.list);

// GET /api/v1/orders/:id
ordersRouter.get('/:id', ordersController.getById);

// POST /api/v1/orders
ordersRouter.post('/', ordersController.create);

// PATCH /api/v1/orders/:id/status
ordersRouter.patch('/:id/status', ordersController.updateStatus);
