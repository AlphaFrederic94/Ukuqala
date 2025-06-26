-- Medical Students Hub Database Schema for Supabase
-- Module 7: Exam Roadmaps

-- ===============================
-- EXAM ROADMAPS TABLES
-- ===============================
CREATE TABLE students_hub.exam_roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  exam_type VARCHAR(20) CHECK (exam_type IN ('USMLE', 'COMLEX', 'Shelf', 'Other')),
  exam_level TEXT NOT NULL,
  exam_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE students_hub.roadmap_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roadmap_id UUID NOT NULL REFERENCES students_hub.exam_roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  section TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================
-- EXAM ROADMAPS FUNCTIONS
-- ===============================

-- Function to get roadmaps with completion statistics
CREATE OR REPLACE FUNCTION students_hub.get_roadmaps_with_stats(
  p_user_id UUID,
  p_exam_type VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  exam_type VARCHAR,
  exam_level TEXT,
  exam_date TIMESTAMP WITH TIME ZONE,
  days_until_exam INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  total_milestones INTEGER,
  completed_milestones INTEGER,
  completion_percentage NUMERIC,
  upcoming_milestones INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
    r.exam_type,
    r.exam_level,
    r.exam_date,
    EXTRACT(DAY FROM r.exam_date - NOW())::INTEGER AS days_until_exam,
    r.created_at,
    r.updated_at,
    COUNT(m.id)::INTEGER AS total_milestones,
    COUNT(CASE WHEN m.completed THEN 1 END)::INTEGER AS completed_milestones,
    CASE 
      WHEN COUNT(m.id) > 0 THEN 
        ROUND((COUNT(CASE WHEN m.completed THEN 1 END)::NUMERIC / COUNT(m.id)::NUMERIC) * 100, 2)
      ELSE 0
    END AS completion_percentage,
    COUNT(CASE WHEN m.due_date IS NOT NULL AND m.due_date > NOW() AND NOT m.completed THEN 1 END)::INTEGER AS upcoming_milestones
  FROM
    students_hub.exam_roadmaps r
  LEFT JOIN
    students_hub.roadmap_milestones m ON r.id = m.roadmap_id
  WHERE
    r.user_id = p_user_id
    AND (p_exam_type IS NULL OR r.exam_type = p_exam_type)
  GROUP BY
    r.id
  ORDER BY
    r.exam_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get milestones by section
CREATE OR REPLACE FUNCTION students_hub.get_milestones_by_section(p_roadmap_id UUID)
RETURNS TABLE (
  section TEXT,
  milestones JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH milestone_data AS (
    SELECT
      COALESCE(m.section, 'General') AS section_name,
      jsonb_build_object(
        'id', m.id,
        'title', m.title,
        'description', m.description,
        'due_date', m.due_date,
        'completed', m.completed,
        'completed_at', m.completed_at,
        'created_at', m.created_at,
        'updated_at', m.updated_at
      ) AS milestone_json
    FROM
      students_hub.roadmap_milestones m
    WHERE
      m.roadmap_id = p_roadmap_id
    ORDER BY
      m.due_date ASC NULLS LAST,
      m.created_at ASC
  )
  SELECT
    section_name,
    jsonb_agg(milestone_json) AS milestones
  FROM
    milestone_data
  GROUP BY
    section_name
  ORDER BY
    section_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get upcoming milestones across all roadmaps
CREATE OR REPLACE FUNCTION students_hub.get_upcoming_milestones(
  p_user_id UUID,
  p_days_ahead INTEGER DEFAULT 14
)
RETURNS TABLE (
  milestone_id UUID,
  roadmap_id UUID,
  roadmap_title TEXT,
  milestone_title TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  days_until_due INTEGER,
  exam_type VARCHAR,
  exam_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS milestone_id,
    m.roadmap_id,
    r.title AS roadmap_title,
    m.title AS milestone_title,
    m.due_date,
    EXTRACT(DAY FROM m.due_date - NOW())::INTEGER AS days_until_due,
    r.exam_type,
    r.exam_date
  FROM
    students_hub.roadmap_milestones m
  JOIN
    students_hub.exam_roadmaps r ON m.roadmap_id = r.id
  WHERE
    r.user_id = p_user_id
    AND m.due_date IS NOT NULL
    AND m.due_date > NOW()
    AND m.due_date <= (NOW() + (p_days_ahead * INTERVAL '1 day'))
    AND NOT m.completed
  ORDER BY
    m.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- EXAM ROADMAPS TRIGGERS
-- ===============================

-- Trigger to update the updated_at timestamp when a roadmap is modified
CREATE OR REPLACE FUNCTION students_hub.update_roadmap_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roadmap_timestamp_trigger
BEFORE UPDATE ON students_hub.exam_roadmaps
FOR EACH ROW
EXECUTE FUNCTION students_hub.update_roadmap_timestamp();

-- Trigger to update the updated_at timestamp when a milestone is modified
CREATE OR REPLACE FUNCTION students_hub.update_milestone_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- If milestone is being marked as completed, set completed_at timestamp
  IF NEW.completed = TRUE AND (OLD.completed = FALSE OR OLD.completed IS NULL) THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- If milestone is being marked as not completed, clear completed_at timestamp
  IF NEW.completed = FALSE AND OLD.completed = TRUE THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_milestone_timestamp_trigger
BEFORE UPDATE ON students_hub.roadmap_milestones
FOR EACH ROW
EXECUTE FUNCTION students_hub.update_milestone_timestamp();

-- Trigger to update parent roadmap's updated_at when a milestone is modified
CREATE OR REPLACE FUNCTION students_hub.update_parent_roadmap_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE students_hub.exam_roadmaps
  SET updated_at = NOW()
  WHERE id = NEW.roadmap_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parent_roadmap_timestamp_trigger
AFTER INSERT OR UPDATE OR DELETE ON students_hub.roadmap_milestones
FOR EACH ROW
EXECUTE FUNCTION students_hub.update_parent_roadmap_timestamp();

-- ===============================
-- EXAM ROADMAPS INDEXES
-- ===============================
CREATE INDEX IF NOT EXISTS idx_exam_roadmaps_user_id ON students_hub.exam_roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_roadmaps_exam_type ON students_hub.exam_roadmaps(exam_type);
CREATE INDEX IF NOT EXISTS idx_exam_roadmaps_exam_date ON students_hub.exam_roadmaps(exam_date);
CREATE INDEX IF NOT EXISTS idx_roadmap_milestones_roadmap_id ON students_hub.roadmap_milestones(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_milestones_due_date ON students_hub.roadmap_milestones(due_date);
CREATE INDEX IF NOT EXISTS idx_roadmap_milestones_completed ON students_hub.roadmap_milestones(completed);
CREATE INDEX IF NOT EXISTS idx_roadmap_milestones_section ON students_hub.roadmap_milestones(section);

-- ===============================
-- EXAM ROADMAPS RLS POLICIES
-- ===============================
ALTER TABLE students_hub.exam_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE students_hub.roadmap_milestones ENABLE ROW LEVEL SECURITY;

-- Exam roadmaps policies
CREATE POLICY exam_roadmaps_select_policy ON students_hub.exam_roadmaps
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY exam_roadmaps_insert_policy ON students_hub.exam_roadmaps
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY exam_roadmaps_update_policy ON students_hub.exam_roadmaps
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY exam_roadmaps_delete_policy ON students_hub.exam_roadmaps
  FOR DELETE USING (auth.uid() = user_id);

-- Roadmap milestones policies (based on roadmap ownership)
CREATE POLICY roadmap_milestones_select_policy ON students_hub.roadmap_milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students_hub.exam_roadmaps r
      WHERE r.id = roadmap_id AND r.user_id = auth.uid()
    )
  );
  
CREATE POLICY roadmap_milestones_insert_policy ON students_hub.roadmap_milestones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM students_hub.exam_roadmaps r
      WHERE r.id = roadmap_id AND r.user_id = auth.uid()
    )
  );
  
CREATE POLICY roadmap_milestones_update_policy ON students_hub.roadmap_milestones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM students_hub.exam_roadmaps r
      WHERE r.id = roadmap_id AND r.user_id = auth.uid()
    )
  );
  
CREATE POLICY roadmap_milestones_delete_policy ON students_hub.roadmap_milestones
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM students_hub.exam_roadmaps r
      WHERE r.id = roadmap_id AND r.user_id = auth.uid()
    )
  );
