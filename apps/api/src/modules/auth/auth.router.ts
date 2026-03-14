import { Router } from 'express';
import { authController } from './auth.controller';

export const authRouter = Router();

// POST /api/v1/auth/login
authRouter.post('/login', authController.login);

// POST /api/v1/auth/refresh
authRouter.post('/refresh', authController.refresh);

// POST /api/v1/auth/logout
authRouter.post('/logout', authController.logout);
