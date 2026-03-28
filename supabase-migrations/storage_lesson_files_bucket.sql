-- Run in Supabase SQL Editor (Dashboard → SQL).
-- Fixes: Storage upload error "Bucket not found" for lesson file uploads.

-- 1) Create public bucket (matches PUBLIC URL: .../object/public/lesson-files/...)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-files',
  'lesson-files',
  true,
  52428800, -- 50 MB; adjust if needed
  NULL      -- allow any type; or e.g. ARRAY['text/markdown','video/mp4','application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- 2) Policies on storage.objects (RLS is enabled by default on storage.objects)

DROP POLICY IF EXISTS "Public read lesson-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated insert lesson-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update lesson-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete lesson-files" ON storage.objects;

CREATE POLICY "Public read lesson-files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lesson-files');

CREATE POLICY "Authenticated insert lesson-files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lesson-files');

CREATE POLICY "Authenticated update lesson-files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'lesson-files')
WITH CHECK (bucket_id = 'lesson-files');

CREATE POLICY "Authenticated delete lesson-files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lesson-files');
