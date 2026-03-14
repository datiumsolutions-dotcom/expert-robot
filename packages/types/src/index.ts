// ─── Base Types ───────────────────────────────────────────────────────────────

export type UUID = string;

export type Timestamps = {
  created_at: Date;
  updated_at: Date;
};

// ─── Organization ─────────────────────────────────────────────────────────────

export type OrganizationStatus = 'active' | 'suspended' | 'cancelled';

export interface Organization extends Timestamps {
  id: UUID;
  name: string;
  slug: string;
  status: OrganizationStatus;
  settings: Record<string, unknown>;
  subscription_plan: string;
  subscription_expires_at: Date | null;
}

// ─── Admin User ───────────────────────────────────────────────────────────────

export type AdminUserRole = 'super_admin' | 'admin' | 'manager' | 'staff';

export interface AdminUser extends Timestamps {
  id: UUID;
  organization_id: UUID;
  email: string;
  password_hash: string;
  name: string;
  role: AdminUserRole;
  is_active: boolean;
  last_login_at: Date | null;
}

// ─── Loyalty Customer ─────────────────────────────────────────────────────────

export interface LoyaltyCustomer extends Timestamps {
  id: UUID;
  organization_id: UUID;
  external_id: string | null;
  phone_number: string;
  full_name: string | null;
  email: string | null;
  birth_date: Date | null;
  total_points: number;
  total_visits: number;
  total_spent: number;
  tier: string;
  is_active: boolean;
  opted_in_marketing: boolean;
  raw_data: Record<string, unknown>;
}

// ─── Loyalty Reward ───────────────────────────────────────────────────────────

export type RewardType = 'discount' | 'free_item' | 'cashback' | 'points_multiplier' | 'custom';

export interface LoyaltyReward extends Timestamps {
  id: UUID;
  organization_id: UUID;
  name: string;
  description: string | null;
  type: RewardType;
  points_required: number;
  value: number;
  is_active: boolean;
  valid_from: Date | null;
  valid_until: Date | null;
  max_redemptions: number | null;
  redemption_count: number;
  metadata: Record<string, unknown>;
}

// ─── Loyalty Order ────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';
export type OrderSource = 'pos' | 'online' | 'app' | 'import' | 'manual';

export interface LoyaltyOrder extends Timestamps {
  id: UUID;
  organization_id: UUID;
  customer_id: UUID | null;
  external_order_id: string | null;
  order_date: Date;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  points_earned: number;
  status: OrderStatus;
  source: OrderSource;
  raw_data: Record<string, unknown>;
}

// ─── Reward Redemption ────────────────────────────────────────────────────────

export type RedemptionStatus = 'pending' | 'applied' | 'cancelled' | 'expired';

export interface RewardRedemption extends Timestamps {
  id: UUID;
  organization_id: UUID;
  customer_id: UUID;
  reward_id: UUID;
  order_id: UUID | null;
  points_spent: number;
  status: RedemptionStatus;
  redeemed_at: Date | null;
  expires_at: Date | null;
  metadata: Record<string, unknown>;
}

// ─── Loyalty Transaction (append-only) ───────────────────────────────────────

export type TransactionType =
  | 'earn'
  | 'redeem'
  | 'expire'
  | 'adjust'
  | 'referral'
  | 'bonus'
  | 'refund';

export interface LoyaltyTransaction {
  id: UUID;
  organization_id: UUID;
  customer_id: UUID;
  order_id: UUID | null;
  redemption_id: UUID | null;
  type: TransactionType;
  points: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  created_at: Date;
}

// ─── Audit Log (append-only) ──────────────────────────────────────────────────

export interface AuditLog {
  id: UUID;
  organization_id: UUID | null;
  actor_id: UUID | null;
  actor_type: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: UUID; // admin_user.id
  org: UUID; // organization_id
  role: AdminUserRole;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface CustomerJwtPayload {
  sub: UUID; // loyalty_customer.id
  org: UUID; // organization_id  
  type: 'customer_access';
  iat?: number;
  exp?: number;
}
