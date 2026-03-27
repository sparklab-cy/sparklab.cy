-- Run in Supabase SQL editor. Fixes invite links + email grants.

-- 1) Resolve auth user id by email (service_role only — used by server actions)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(lookup_email TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id FROM auth.users
  WHERE lower(trim(email)) = lower(trim(lookup_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_user_id_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO service_role;

-- 2) course_access_grants: allow students to insert their own row when joining via invite
DROP POLICY IF EXISTS "grants_insert" ON course_access_grants;
DROP POLICY IF EXISTS "grants_insert_creator" ON course_access_grants;
DROP POLICY IF EXISTS "grants_insert_self_invite" ON course_access_grants;

CREATE POLICY "grants_insert_creator" ON course_access_grants
  FOR INSERT WITH CHECK (auth.uid() = granted_by);

CREATE POLICY "grants_insert_self_invite" ON course_access_grants
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM custom_courses c
      WHERE c.id = course_id AND c.creator_id = granted_by
    )
  );

-- 3) Allow grantees to update their own row (e.g. joined_at)
DROP POLICY IF EXISTS "grants_update_own" ON course_access_grants;
CREATE POLICY "grants_update_own" ON course_access_grants
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4) custom_courses: one SELECT policy — published public, own drafts, or granted access
DROP POLICY IF EXISTS "custom_courses_select_public" ON custom_courses;
DROP POLICY IF EXISTS "custom_courses_select_own" ON custom_courses;
DROP POLICY IF EXISTS "custom_courses_select" ON custom_courses;

CREATE POLICY "custom_courses_select" ON custom_courses
  FOR SELECT USING (
    (is_published = true AND is_public = true)
    OR auth.uid() = creator_id
    OR auth.uid() IN (
      SELECT user_id FROM course_access_grants WHERE course_id = custom_courses.id
    )
  );
