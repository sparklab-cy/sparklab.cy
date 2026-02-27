-- Run this in the Supabase SQL editor to fix RLS policy errors.
-- This covers all tables that community creators and users interact with.

-- ============================================================
-- custom_courses
-- ============================================================
ALTER TABLE custom_courses ENABLE ROW LEVEL SECURITY;

-- Anyone can read published public courses
CREATE POLICY "custom_courses_select_public" ON custom_courses
  FOR SELECT USING (is_published = true AND is_public = true);

-- Creators can read their own courses (including drafts)
CREATE POLICY "custom_courses_select_own" ON custom_courses
  FOR SELECT USING (auth.uid() = creator_id);

-- Authenticated users can INSERT rows where they are the creator
CREATE POLICY "custom_courses_insert" ON custom_courses
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Creators can update their own courses
CREATE POLICY "custom_courses_update" ON custom_courses
  FOR UPDATE USING (auth.uid() = creator_id);

-- Creators can delete their own courses
CREATE POLICY "custom_courses_delete" ON custom_courses
  FOR DELETE USING (auth.uid() = creator_id);


-- ============================================================
-- lessons
-- ============================================================
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read published lessons
CREATE POLICY "lessons_select" ON lessons
  FOR SELECT USING (is_published = true);

-- Admins and course creators can read all lessons (including drafts)
-- by joining through custom_courses
CREATE POLICY "lessons_select_own" ON lessons
  FOR SELECT USING (
    auth.uid() IN (
      SELECT creator_id FROM custom_courses WHERE id = lessons.course_id
    )
    OR course_type = 'official'
  );

-- Authenticated users can insert lessons for their own custom courses
CREATE POLICY "lessons_insert" ON lessons
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT creator_id FROM custom_courses WHERE id = course_id
    )
    OR course_type = 'official'
  );

-- Authenticated users can update lessons they own
CREATE POLICY "lessons_update" ON lessons
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT creator_id FROM custom_courses WHERE id = lessons.course_id
    )
    OR course_type = 'official'
  );

-- Authenticated users can delete lessons they own
CREATE POLICY "lessons_delete" ON lessons
  FOR DELETE USING (
    auth.uid() IN (
      SELECT creator_id FROM custom_courses WHERE id = lessons.course_id
    )
    OR course_type = 'official'
  );


-- ============================================================
-- user_permissions
-- ============================================================
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Users can read their own permissions
CREATE POLICY "user_permissions_select" ON user_permissions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role / admins grant permissions (enforced at API level)
CREATE POLICY "user_permissions_insert" ON user_permissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "user_permissions_update" ON user_permissions
  FOR UPDATE USING (true);


-- ============================================================
-- purchases
-- ============================================================
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchases_select" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "purchases_insert" ON purchases
  FOR INSERT WITH CHECK (true);


-- ============================================================
-- user_lesson_progress
-- ============================================================
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress_select" ON user_lesson_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "progress_insert" ON user_lesson_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "progress_update" ON user_lesson_progress
  FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================
-- kits  (read-only for regular users; admin-managed via service role)
-- ============================================================
ALTER TABLE kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kits_select" ON kits
  FOR SELECT USING (true);


-- ============================================================
-- official_courses  (read-only for regular users)
-- ============================================================
ALTER TABLE official_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "official_courses_select" ON official_courses
  FOR SELECT USING (is_published = true);


-- ============================================================
-- profiles
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile; admins can read all
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);
