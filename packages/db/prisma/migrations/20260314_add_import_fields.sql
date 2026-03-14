-- Migration: add_import_fields
-- Adds columns required by M02 that were missing from bootstrap

ALTER TABLE loyalty_orders
  ADD COLUMN IF NOT EXISTS points_processed_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE loyalty_orders
  ADD COLUMN IF NOT EXISTS match_method VARCHAR(30) DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_org_external_id
  ON loyalty_orders (organization_id, external_order_id)
  WHERE external_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_unprocessed
  ON loyalty_orders (organization_id, points_processed_at)
  WHERE points_processed_at IS NULL;
