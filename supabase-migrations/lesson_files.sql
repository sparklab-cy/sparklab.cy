-- Run this in the Supabase SQL editor
-- Also create a PUBLIC Storage bucket named: lesson-files

CREATE TABLE IF NOT EXISTS lesson_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id     UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  file_type     TEXT NOT NULL CHECK (file_type IN ('markdown', 'video', 'svelte')),
  storage_path  TEXT NOT NULL,
  compiled_path TEXT,
  tab_order     INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lesson_files_lesson_id_idx ON lesson_files(lesson_id);

-- RLS: enable row-level security
ALTER TABLE lesson_files ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read files for lessons they can access
CREATE POLICY "lesson_files_select" ON lesson_files
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only the lesson's course creator or an admin can insert/update/delete
-- (enforced at API level; this is a permissive base policy)
CREATE POLICY "lesson_files_insert" ON lesson_files
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "lesson_files_delete" ON lesson_files
  FOR DELETE USING (auth.role() = 'authenticated');
