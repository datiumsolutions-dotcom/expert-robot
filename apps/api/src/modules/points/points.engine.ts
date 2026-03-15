import type { Prisma } from '@prisma/client';
import { AppError } from '@loyalty/utils';

type PrismaTransactionClient = Prisma.TransactionClient;

export function calculatePoints(totalAmount: number, amountPerPoint: number): number {
  if (amountPerPoint <= 0) return 0;
  return Math.floor(totalAmount / amountPerPoint);
}

export async function assignPointsForOrder(
  tx: PrismaTransactionClient,
  orgId: string,
  orderId: string,
  customerId: string,
  totalAmount: number,
  amountPerPoint: number,
): Promise<{ points_assigned: number; skipped_reason?: string }> {
  const order = await tx.loyaltyOrder.findFirst({
    where: { id: orderId, organization_id: orgId, customer_id: customerId },
  });

  if (!order) {
    throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
  }

  if (order.points_processed_at) {
    return { points_assigned: 0, skipped_reason: 'already_processed' };
  }

  const points = calculatePoints(totalAmount, amountPerPoint);
  const processedAt = new Date();

  if (points === 0) {
    await tx.loyaltyOrder.update({
      where: { id: orderId },
      data: { points_processed_at: processedAt, points_earned: 0 },
    });

    await tx.auditLog.create({
      data: {
        organization_id: orgId,
        action: 'points.earn',
        resource_type: 'loyalty_order',
        resource_id: orderId,
        new_value: { points_assigned: 0, skipped_reason: 'below_threshold' },
      },
    });

    return { points_assigned: 0, skipped_reason: 'below_threshold' };
  }

  const customer = await tx.loyaltyCustomer.findFirst({
    where: { id: customerId, organization_id: orgId },
  });

  if (!customer) {
    throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
  }

  const balanceBefore = customer.total_points;
  const balanceAfter = balanceBefore + points;

  if (balanceAfter !== balanceBefore + points) {
    throw new AppError('Transaction balance invariant failed', 500, 'BALANCE_INVARIANT_FAILED');
  }

  await tx.loyaltyTransaction.create({
    data: {
      organization_id: orgId,
      customer_id: customerId,
      order_id: orderId,
      type: 'earn',
      points,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: `Points earned for order ${orderId}`,
    },
  });

  await tx.loyaltyCustomer.update({
    where: { id: customerId },
    data: { total_points: { increment: points } },
  });

  await tx.loyaltyOrder.update({
    where: { id: orderId },
    data: { points_earned: points, points_processed_at: processedAt },
  });

  await tx.auditLog.create({
    data: {
      organization_id: orgId,
      action: 'points.earn',
      resource_type: 'loyalty_order',
      resource_id: orderId,
      new_value: { points_assigned: points, balance_before: balanceBefore, balance_after: balanceAfter },
    },
  });

  return { points_assigned: points };
}

export async function reversePointsForOrder(
  tx: PrismaTransactionClient,
  orgId: string,
  orderId: string,
): Promise<{ points_reversed: number; skipped_reason?: string }> {
  const order = await tx.loyaltyOrder.findFirst({
    where: { id: orderId, organization_id: orgId },
  });

  if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

  if (!order.points_processed_at) {
    return { points_reversed: 0, skipped_reason: 'not_processed' };
  }

  if (!order.customer_id) {
    return { points_reversed: 0, skipped_reason: 'no_customer' };
  }

  if (order.points_earned <= 0) {
    return { points_reversed: 0, skipped_reason: 'no_points_to_reverse' };
  }

  const customer = await tx.loyaltyCustomer.findFirst({
    where: { id: order.customer_id, organization_id: orgId },
  });

  if (!customer) throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');

  const pointsToReverse = Math.min(customer.total_points, order.points_earned);
  const balanceBefore = customer.total_points;
  const balanceAfter = Math.max(0, balanceBefore - pointsToReverse);

  await tx.loyaltyTransaction.create({
    data: {
      organization_id: orgId,
      customer_id: customer.id,
      order_id: orderId,
      type: 'refund',
      points: -pointsToReverse,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: `Points reversal for cancelled order ${orderId}`,
    },
  });

  await tx.loyaltyCustomer.update({
    where: { id: customer.id },
    data: { total_points: balanceAfter },
  });

  await tx.auditLog.create({
    data: {
      organization_id: orgId,
      action: 'points.reversal',
      resource_type: 'loyalty_order',
      resource_id: orderId,
      new_value: { points_reversed: pointsToReverse, balance_before: balanceBefore, balance_after: balanceAfter },
    },
  });

  return { points_reversed: pointsToReverse };
}

export async function redeemPoints(
  tx: PrismaTransactionClient,
  orgId: string,
  redemptionId: string,
  fulfilledByAdminId: string,
): Promise<{ points_redeemed: number }> {
  const redemption = await tx.rewardRedemption.findFirst({
    where: { id: redemptionId, organization_id: orgId },
  });

  if (!redemption) throw new AppError('Redemption not found', 404, 'REDEMPTION_NOT_FOUND');

  if (redemption.status !== 'pending') {
    throw new AppError('Redemption is not pending', 409, 'INVALID_REDEMPTION_STATUS');
  }

  const customer = await tx.loyaltyCustomer.findFirst({
    where: { id: redemption.customer_id, organization_id: orgId },
  });

  if (!customer) throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');

  if (customer.total_points < redemption.points_spent) {
    throw new AppError('Insufficient points', 409, 'INSUFFICIENT_POINTS');
  }

  const balanceBefore = customer.total_points;
  const pointsRedeemed = redemption.points_spent;
  const balanceAfter = balanceBefore - pointsRedeemed;

  await tx.loyaltyTransaction.create({
    data: {
      organization_id: orgId,
      customer_id: customer.id,
      redemption_id: redemptionId,
      order_id: redemption.order_id,
      type: 'redeem',
      points: -pointsRedeemed,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: `Points redeemed for redemption ${redemptionId}`,
    },
  });

  await tx.loyaltyCustomer.update({
    where: { id: customer.id },
    data: { total_points: balanceAfter },
  });

  await tx.rewardRedemption.update({
    where: { id: redemptionId },
    data: { status: 'applied', redeemed_at: new Date() },
  });

  await tx.auditLog.create({
    data: {
      organization_id: orgId,
      actor_id: fulfilledByAdminId,
      actor_type: 'admin',
      action: 'redemption.fulfil',
      resource_type: 'reward_redemption',
      resource_id: redemptionId,
      new_value: { points_redeemed: pointsRedeemed, balance_before: balanceBefore, balance_after: balanceAfter },
    },
  });

  return { points_redeemed: pointsRedeemed };
}
