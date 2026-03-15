import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { customersController } from './customers.controller';

export const customersRouter: ExpressRouter = Router();

// GET /api/v1/customers
customersRouter.get('/', customersController.list);

// GET /api/v1/customers/:id
customersRouter.get('/:id', customersController.getById);

// POST /api/v1/customers
customersRouter.post('/', customersController.create);

// PATCH /api/v1/customers/:id
customersRouter.patch('/:id', customersController.update);

// DELETE /api/v1/customers/:id
customersRouter.delete('/:id', customersController.remove);

// GET /api/v1/customers/:id/transactions
customersRouter.get('/:id/transactions', customersController.getTransactions);
