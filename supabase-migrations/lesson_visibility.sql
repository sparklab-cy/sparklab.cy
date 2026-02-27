-- Run this in the Supabase SQL editor.

-- ============================================================
-- 1. Track when a user first accesses the course (vs just invited)
-- ============================================================
ALTER TABLE course_access_grants
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ;


-- ============================================================
-- 2. Per-user lesson visibility
--    A row here with is_visible = false means that user cannot
--    see that lesson. No row (default) = visible.
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_user_visibility (
  lesson_id  UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_visible BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (lesson_id, user_id)
);

ALTER TABLE lesson_user_visibility ENABLE ROW LEVEL SECURITY;

-- Creators and students can both read (needed to filter lesson lists)
CREATE POLICY "luv_select" ON lesson_user_visibility
  FOR SELECT USING (auth.role() = 'authenticated');

-- Controlled at API level; any authenticated user can upsert
CREATE POLICY "luv_insert" ON lesson_user_visibility
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "luv_update" ON lesson_user_visibility
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "luv_delete" ON lesson_user_visibility
  FOR DELETE USING (auth.role() = 'authenticated');
