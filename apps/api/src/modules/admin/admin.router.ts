import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { adminsController } from './admin.controller';

export const adminRouter: ExpressRouter = Router();

// GET /api/v1/admin/users
adminRouter.get('/users', adminsController.listUsers);

// GET /api/v1/admin/users/:id
adminRouter.get('/users/:id', adminsController.getUser);

// POST /api/v1/admin/users
adminRouter.post('/users', adminsController.createUser);

// PATCH /api/v1/admin/users/:id
adminRouter.patch('/users/:id', adminsController.updateUser);

// DELETE /api/v1/admin/users/:id
adminRouter.delete('/users/:id', adminsController.deleteUser);

// GET /api/v1/admin/me
adminRouter.get('/me', adminsController.getMe);
