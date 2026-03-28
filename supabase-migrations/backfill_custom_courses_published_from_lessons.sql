-- Optional one-time fix: courses that have published lessons but custom_courses.is_published was never set
-- (e.g. published only from the lesson editor before the server synced the course row).
-- Run in Supabase SQL editor when upgrading from older behavior.

UPDATE custom_courses cc
SET is_published = true
WHERE cc.is_published = false
  AND EXISTS (
    SELECT 1
    FROM lessons l
    WHERE l.course_id = cc.id
      AND l.course_type = 'custom'
      AND l.is_published = true
  );
