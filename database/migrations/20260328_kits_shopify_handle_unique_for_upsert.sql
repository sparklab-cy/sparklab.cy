-- PostgREST upsert(onConflict: 'shopify_handle') requires a real UNIQUE constraint,
-- not a partial unique index (error 42P10).

ALTER TABLE kits ADD COLUMN IF NOT EXISTS shopify_handle TEXT;

DROP INDEX IF EXISTS kits_shopify_handle_key;

ALTER TABLE kits DROP CONSTRAINT IF EXISTS kits_shopify_handle_key;
ALTER TABLE kits DROP CONSTRAINT IF EXISTS kits_shopify_handle_unique;

-- Nullable column: multiple rows may still have shopify_handle IS NULL (Postgres treats NULLs as distinct).
ALTER TABLE kits ADD CONSTRAINT kits_shopify_handle_unique UNIQUE (shopify_handle);
