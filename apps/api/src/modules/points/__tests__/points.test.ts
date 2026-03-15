import { calculatePoints, assignPointsForOrder, reversePointsForOrder, redeemPoints } from '../points.engine';

function createTxMock() {
  return {
    loyaltyOrder: { findFirst: jest.fn(), update: jest.fn() },
    loyaltyCustomer: { findFirst: jest.fn(), update: jest.fn() },
    loyaltyTransaction: { create: jest.fn() },
    rewardRedemption: { findFirst: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
  } as any;
}

describe('calculatePoints', () => {
  it('calculates floor-based points', () => {
    expect(calculatePoints(45000, 10000)).toBe(4);
    expect(calculatePoints(9999, 10000)).toBe(0);
    expect(calculatePoints(10000, 10000)).toBe(1);
    expect(calculatePoints(0, 10000)).toBe(0);
    expect(calculatePoints(10000, 0)).toBe(0);
  });
});

describe('assignPointsForOrder', () => {
  it('skips already processed orders', async () => {
    const tx = createTxMock();
    tx.loyaltyOrder.findFirst.mockResolvedValue({ id: 'o1', points_processed_at: new Date(), customer_id: 'c1' });

    await expect(assignPointsForOrder(tx, 'org1', 'o1', 'c1', 45000, 10000)).resolves.toEqual({
      points_assigned: 0,
      skipped_reason: 'already_processed',
    });
  });

  it('below threshold marks processed and skips', async () => {
    const tx = createTxMock();
    tx.loyaltyOrder.findFirst.mockResolvedValue({ id: 'o1', points_processed_at: null, customer_id: 'c1' });

    const res = await assignPointsForOrder(tx, 'org1', 'o1', 'c1', 9999, 10000);

    expect(res).toEqual({ points_assigned: 0, skipped_reason: 'below_threshold' });
    expect(tx.loyaltyOrder.update).toHaveBeenCalled();
  });

  it('creates transaction and updates balances for valid amount', async () => {
    const tx = createTxMock();
    tx.loyaltyOrder.findFirst.mockResolvedValue({ id: 'o1', points_processed_at: null, customer_id: 'c1' });
    tx.loyaltyCustomer.findFirst.mockResolvedValue({ id: 'c1', total_points: 10 });

    const res = await assignPointsForOrder(tx, 'org1', 'o1', 'c1', 45000, 10000);

    expect(res).toEqual({ points_assigned: 4 });
    expect(tx.loyaltyTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ balance_before: 10, points: 4, balance_after: 14 }),
      }),
    );

    const trxData = tx.loyaltyTransaction.create.mock.calls[0][0].data;
    expect(trxData.balance_after).toBe(trxData.balance_before + trxData.points);
  });
});

describe('reversePointsForOrder', () => {
  it('skips if order was never processed', async () => {
    const tx = createTxMock();
    tx.loyaltyOrder.findFirst.mockResolvedValue({ id: 'o1', points_processed_at: null, points_earned: 4, customer_id: 'c1' });

    await expect(reversePointsForOrder(tx, 'org1', 'o1')).resolves.toEqual({
      points_reversed: 0,
      skipped_reason: 'not_processed',
    });
  });

  it('skips if points_earned is 0', async () => {
    const tx = createTxMock();
    tx.loyaltyOrder.findFirst.mockResolvedValue({ id: 'o1', points_processed_at: new Date(), points_earned: 0, customer_id: 'c1' });

    await expect(reversePointsForOrder(tx, 'org1', 'o1')).resolves.toEqual({
      points_reversed: 0,
      skipped_reason: 'no_points_to_reverse',
    });
  });

  it('reverses points and never drops below zero', async () => {
    const tx = createTxMock();
    tx.loyaltyOrder.findFirst.mockResolvedValue({ id: 'o1', points_processed_at: new Date(), points_earned: 10, customer_id: 'c1' });
    tx.loyaltyCustomer.findFirst.mockResolvedValue({ id: 'c1', total_points: 3 });

    const result = await reversePointsForOrder(tx, 'org1', 'o1');

    expect(result).toEqual({ points_reversed: 3 });
    expect(tx.loyaltyTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ points: -3, balance_after: 0 }) }),
    );
  });
});

describe('redeemPoints', () => {
  it('throws when redemption is not pending', async () => {
    const tx = createTxMock();
    tx.rewardRedemption.findFirst.mockResolvedValue({
      id: 'r1',
      organization_id: 'org1',
      customer_id: 'c1',
      points_spent: 100,
      status: 'applied',
    });

    await expect(redeemPoints(tx, 'org1', 'r1', 'admin1')).rejects.toMatchObject({ code: 'INVALID_REDEMPTION_STATUS' });
  });

  it('throws INSUFFICIENT_POINTS for low balance', async () => {
    const tx = createTxMock();
    tx.rewardRedemption.findFirst.mockResolvedValue({
      id: 'r1',
      organization_id: 'org1',
      customer_id: 'c1',
      points_spent: 100,
      status: 'pending',
      order_id: null,
    });
    tx.loyaltyCustomer.findFirst.mockResolvedValue({ id: 'c1', organization_id: 'org1', total_points: 10 });

    await expect(redeemPoints(tx, 'org1', 'r1', 'admin1')).rejects.toMatchObject({ code: 'INSUFFICIENT_POINTS' });
  });

  it('redeems points and applies redemption', async () => {
    const tx = createTxMock();
    tx.rewardRedemption.findFirst.mockResolvedValue({
      id: 'r1',
      organization_id: 'org1',
      customer_id: 'c1',
      points_spent: 40,
      status: 'pending',
      order_id: null,
    });
    tx.loyaltyCustomer.findFirst.mockResolvedValue({ id: 'c1', organization_id: 'org1', total_points: 100 });

    const result = await redeemPoints(tx, 'org1', 'r1', 'admin1');

    expect(result).toEqual({ points_redeemed: 40 });
    expect(tx.loyaltyTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ points: -40, balance_before: 100, balance_after: 60 }) }),
    );
    expect(tx.rewardRedemption.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'applied' }) }),
    );
  });
});
