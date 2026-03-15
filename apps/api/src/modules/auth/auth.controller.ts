import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { successResponse } from '@loyalty/utils';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, organization_slug } = req.body as {
        email: string;
        password: string;
        organization_slug: string;
      };
      const result = await authService.login(email, password, organization_slug);
      res.status(200).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refresh_token } = req.body as { refresh_token: string };
      const result = await authService.refreshToken(refresh_token);
      res.status(200).json(successResponse(result));
    } catch (err) {
      next(err);
    }
  },

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout();
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
