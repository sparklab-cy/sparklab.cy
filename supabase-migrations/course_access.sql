-- Run this in the Supabase SQL editor.

-- ============================================================
-- 1. Add invite_token to custom_courses (for shareable links)
-- ============================================================
ALTER TABLE custom_courses
  ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE DEFAULT gen_random_uuid()::text;

-- Back-fill any rows that have a NULL invite_token
UPDATE custom_courses
  SET invite_token = gen_random_uuid()::text
  WHERE invite_token IS NULL;


-- ============================================================
-- 2. Per-user access grants for private courses
-- ============================================================
CREATE TABLE IF NOT EXISTS course_access_grants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID NOT NULL REFERENCES custom_courses(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id)       ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id, user_id)
);

ALTER TABLE course_access_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "grants_select" ON course_access_grants
  FOR SELECT USING (
    auth.uid() = user_id OR auth.uid() = granted_by
  );

CREATE POLICY "grants_insert" ON course_access_grants
  FOR INSERT WITH CHECK (
    auth.uid() = granted_by
  );

CREATE POLICY "grants_delete" ON course_access_grants
  FOR DELETE USING (
    auth.uid() = granted_by
  );


-- ============================================================
-- 3. Update custom_courses SELECT policy
--    Allows: public published courses, creator's own courses,
--    and courses the user has been granted access to.
-- ============================================================
DROP POLICY IF EXISTS "custom_courses_select_public" ON custom_courses;
DROP POLICY IF EXISTS "custom_courses_select_own"    ON custom_courses;

CREATE POLICY "custom_courses_select" ON custom_courses
  FOR SELECT USING (
    (is_published = true AND is_public = true)
    OR auth.uid() = creator_id
    OR auth.uid() IN (
      SELECT user_id FROM course_access_grants WHERE course_id = custom_courses.id
    )
  );
