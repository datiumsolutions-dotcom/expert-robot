import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import { authRouter } from './modules/auth/auth.router';
import { adminRouter } from './modules/admin/admin.router';
import { customersRouter } from './modules/customers/customers.router';
import { ordersRouter } from './modules/orders/orders.router';
import { rewardsRouter } from './modules/rewards/rewards.router';
import { redemptionsRouter } from './modules/redemptions/redemptions.router';
import { importRouter } from './modules/import/import.router';
import { auditRouter } from './modules/audit/audit.router';
import { authenticate } from './middleware/auth';
import { orgIsolation } from './middleware/orgIsolation';

export const router: ExpressRouter = Router();

// Health (public)
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
router.use('/auth', authRouter);

// Protected routes (require auth + org context)
router.use(authenticate, orgIsolation);
router.use('/admin', adminRouter);
router.use('/customers', customersRouter);
router.use('/orders', ordersRouter);
router.use('/rewards', rewardsRouter);
router.use('/redemptions', redemptionsRouter);
router.use('/import', importRouter);
router.use('/audit', auditRouter);
