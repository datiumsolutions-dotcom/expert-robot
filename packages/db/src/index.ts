export { PrismaClient } from '@prisma/client';
export type {
  Organization,
  AdminUser,
  LoyaltyCustomer,
  LoyaltyReward,
  LoyaltyOrder,
  RewardRedemption,
  LoyaltyTransaction,
  AuditLog,
  OrganizationStatus,
  AdminUserRole,
  RewardType,
  OrderStatus,
  OrderSource,
  RedemptionStatus,
  TransactionType,
  Prisma,
} from '@prisma/client';

export { prisma, prisma as db, connectDB, disconnectDB } from './client';
