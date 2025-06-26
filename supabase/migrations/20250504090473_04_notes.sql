-- Medical Students Hub Database Schema for Supabase
-- Module 4: Notes

-- ===============================
-- NOTES TABLES
-- ===============================
CREATE TABLE students_hub.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  subject_id UUID REFERENCES students_hub.subjects(id) ON DELETE SET NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE students_hub.note_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES students_hub.notes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================
-- NOTES FUNCTIONS
-- ===============================

-- Function to search notes by content and tags
CREATE OR REPLACE FUNCTION students_hub.search_notes(
  p_user_id UUID,
  p_search_term TEXT,
  p_subject_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  subject_name TEXT,
  is_favorite BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.content,
    s.name AS subject_name,
    n.is_favorite,
    n.created_at,
    n.updated_at,
    ARRAY_AGG(DISTINCT nt.tag) AS tags
  FROM
    students_hub.notes n
  LEFT JOIN
    students_hub.subjects s ON n.subject_id = s.id
  LEFT JOIN
    students_hub.note_tags nt ON n.id = nt.note_id
  WHERE
    n.user_id = p_user_id
    AND (p_subject_id IS NULL OR n.subject_id = p_subject_id)
    AND (
      n.title ILIKE '%' || p_search_term || '%'
      OR n.content ILIKE '%' || p_search_term || '%'
      OR EXISTS (
        SELECT 1 FROM students_hub.note_tags t
        WHERE t.note_id = n.id AND t.tag ILIKE '%' || p_search_term || '%'
      )
    )
  GROUP BY
    n.id, s.name
  ORDER BY
    n.is_favorite DESC,
    n.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get all tags for a user
CREATE OR REPLACE FUNCTION students_hub.get_user_tags(p_user_id UUID)
RETURNS TABLE (
  tag TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    nt.tag,
    COUNT(DISTINCT nt.note_id) AS count
  FROM
    students_hub.note_tags nt
  JOIN
    students_hub.notes n ON nt.note_id = n.id
  WHERE
    n.user_id = p_user_id
  GROUP BY
    nt.tag
  ORDER BY
    count DESC, tag;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- NOTES TRIGGERS
-- ===============================

-- Trigger to update the updated_at timestamp when a note is modified
CREATE OR REPLACE FUNCTION students_hub.update_note_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_note_timestamp_trigger
BEFORE UPDATE ON students_hub.notes
FOR EACH ROW
EXECUTE FUNCTION students_hub.update_note_timestamp();

-- ===============================
-- NOTES INDEXES
-- ===============================
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON students_hub.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_subject_id ON students_hub.notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_favorite ON students_hub.notes(is_favorite);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON students_hub.notes(updated_at);
CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON students_hub.note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON students_hub.note_tags(tag);

-- ===============================
-- NOTES RLS POLICIES
-- ===============================
ALTER TABLE students_hub.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students_hub.note_tags ENABLE ROW LEVEL SECURITY;

-- Notes policies
CREATE POLICY notes_select_policy ON students_hub.notes
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY notes_insert_policy ON students_hub.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY notes_update_policy ON students_hub.notes
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY notes_delete_policy ON students_hub.notes
  FOR DELETE USING (auth.uid() = user_id);

-- Note tags policies (based on note ownership)
CREATE POLICY note_tags_select_policy ON students_hub.note_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students_hub.notes n
      WHERE n.id = note_id AND n.user_id = auth.uid()
    )
  );
  
CREATE POLICY note_tags_insert_policy ON students_hub.note_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM students_hub.notes n
      WHERE n.id = note_id AND n.user_id = auth.uid()
    )
  );
  
CREATE POLICY note_tags_update_policy ON students_hub.note_tags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM students_hub.notes n
      WHERE n.id = note_id AND n.user_id = auth.uid()
    )
  );
  
CREATE POLICY note_tags_delete_policy ON students_hub.note_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM students_hub.notes n
      WHERE n.id = note_id AND n.user_id = auth.uid()
    )
  );
