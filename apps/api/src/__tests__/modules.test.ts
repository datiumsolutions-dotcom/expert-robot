jest.mock('@loyalty/db/src/client', () => ({ prisma: {} }));

import { authRouter } from '../modules/auth/auth.router';
import { adminsController } from '../modules/admin/admin.controller';
import { customersController } from '../modules/customers/customers.controller';
import { ordersController } from '../modules/orders/orders.controller';
import { rewardsController } from '../modules/rewards/rewards.controller';
import { redemptionsController } from '../modules/redemptions/redemptions.controller';
import { importController } from '../modules/import/import.controller';
import { auditController } from '../modules/audit/audit.controller';

describe('Module exports smoke test', () => {
  it('authRouter exports a Router', () => {
    expect(authRouter).toBeDefined();
    expect(typeof authRouter).toBe('function');
  });

  it('adminsController exports required methods', () => {
    expect(adminsController.listUsers).toBeDefined();
    expect(adminsController.getUser).toBeDefined();
    expect(adminsController.createUser).toBeDefined();
  });

  it('customersController exports required methods', () => {
    expect(customersController.list).toBeDefined();
    expect(customersController.create).toBeDefined();
    expect(customersController.getTransactions).toBeDefined();
  });

  it('ordersController exports required methods', () => {
    expect(ordersController.list).toBeDefined();
    expect(ordersController.create).toBeDefined();
  });

  it('rewardsController exports required methods', () => {
    expect(rewardsController.list).toBeDefined();
    expect(rewardsController.create).toBeDefined();
  });

  it('redemptionsController exports required methods', () => {
    expect(redemptionsController.list).toBeDefined();
    expect(redemptionsController.cancel).toBeDefined();
  });

  it('importController exports required methods', () => {
    expect(importController.importOrders).toBeDefined();
  });

  it('auditController exports required methods', () => {
    expect(auditController.list).toBeDefined();
    expect(auditController.getById).toBeDefined();
  });
});
