-- Link Shopify catalog products to kits rows for sync/upsert.
-- Must be a plain UNIQUE constraint (not a partial index) so PostgREST upsert works.
ALTER TABLE kits ADD COLUMN IF NOT EXISTS shopify_handle TEXT;

ALTER TABLE kits DROP CONSTRAINT IF EXISTS kits_shopify_handle_unique;
ALTER TABLE kits ADD CONSTRAINT kits_shopify_handle_unique UNIQUE (shopify_handle);
