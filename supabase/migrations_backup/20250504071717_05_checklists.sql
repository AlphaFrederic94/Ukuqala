-- Medical Students Hub Database Schema for Supabase
-- Module 5: Checklists

-- ===============================
-- CHECKLISTS TABLES
-- ===============================
CREATE TABLE students_hub.checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(20) CHECK (category IN ('revision', 'rotation', 'exam', 'application', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE students_hub.checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES students_hub.checklists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================
-- CHECKLISTS FUNCTIONS
-- ===============================

-- Function to get checklists with completion statistics
CREATE OR REPLACE FUNCTION students_hub.get_checklists_with_stats(
  p_user_id UUID,
  p_category VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  total_items INTEGER,
  completed_items INTEGER,
  completion_percentage NUMERIC,
  upcoming_due_items INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.description,
    c.category,
    c.created_at,
    c.updated_at,
    COUNT(i.id)::INTEGER AS total_items,
    COUNT(CASE WHEN i.completed THEN 1 END)::INTEGER AS completed_items,
    CASE 
      WHEN COUNT(i.id) > 0 THEN 
        ROUND((COUNT(CASE WHEN i.completed THEN 1 END)::NUMERIC / COUNT(i.id)::NUMERIC) * 100, 2)
      ELSE 0
    END AS completion_percentage,
    COUNT(CASE WHEN i.due_date IS NOT NULL AND i.due_date > NOW() AND NOT i.completed THEN 1 END)::INTEGER AS upcoming_due_items
  FROM
    students_hub.checklists c
  LEFT JOIN
    students_hub.checklist_items i ON c.id = i.checklist_id
  WHERE
    c.user_id = p_user_id
    AND (p_category IS NULL OR c.category = p_category)
  GROUP BY
    c.id
  ORDER BY
    c.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get upcoming due items across all checklists
CREATE OR REPLACE FUNCTION students_hub.get_upcoming_due_items(
  p_user_id UUID,
  p_days_ahead INTEGER DEFAULT 7
)
RETURNS TABLE (
  item_id UUID,
  checklist_id UUID,
  checklist_title TEXT,
  item_title TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  days_until_due INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id AS item_id,
    i.checklist_id,
    c.title AS checklist_title,
    i.title AS item_title,
    i.due_date,
    EXTRACT(DAY FROM i.due_date - NOW())::INTEGER AS days_until_due
  FROM
    students_hub.checklist_items i
  JOIN
    students_hub.checklists c ON i.checklist_id = c.id
  WHERE
    c.user_id = p_user_id
    AND i.due_date IS NOT NULL
    AND i.due_date > NOW()
    AND i.due_date <= (NOW() + (p_days_ahead * INTERVAL '1 day'))
    AND NOT i.completed
  ORDER BY
    i.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- CHECKLISTS TRIGGERS
-- ===============================

-- Trigger to update the updated_at timestamp when a checklist is modified
CREATE OR REPLACE FUNCTION students_hub.update_checklist_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_checklist_timestamp_trigger
BEFORE UPDATE ON students_hub.checklists
FOR EACH ROW
EXECUTE FUNCTION students_hub.update_checklist_timestamp();

-- Trigger to update the updated_at timestamp when a checklist item is modified
CREATE OR REPLACE FUNCTION students_hub.update_checklist_item_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- If item is being marked as completed, set completed_at timestamp
  IF NEW.completed = TRUE AND (OLD.completed = FALSE OR OLD.completed IS NULL) THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- If item is being marked as not completed, clear completed_at timestamp
  IF NEW.completed = FALSE AND OLD.completed = TRUE THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_checklist_item_timestamp_trigger
BEFORE UPDATE ON students_hub.checklist_items
FOR EACH ROW
EXECUTE FUNCTION students_hub.update_checklist_item_timestamp();

-- Trigger to update parent checklist's updated_at when an item is modified
CREATE OR REPLACE FUNCTION students_hub.update_parent_checklist_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE students_hub.checklists
  SET updated_at = NOW()
  WHERE id = NEW.checklist_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parent_checklist_timestamp_trigger
AFTER INSERT OR UPDATE OR DELETE ON students_hub.checklist_items
FOR EACH ROW
EXECUTE FUNCTION students_hub.update_parent_checklist_timestamp();

-- ===============================
-- CHECKLISTS INDEXES
-- ===============================
CREATE INDEX IF NOT EXISTS idx_checklists_user_id ON students_hub.checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_checklists_category ON students_hub.checklists(category);
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist_id ON students_hub.checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_due_date ON students_hub.checklist_items(due_date);
CREATE INDEX IF NOT EXISTS idx_checklist_items_completed ON students_hub.checklist_items(completed);

-- ===============================
-- CHECKLISTS RLS POLICIES
-- ===============================
ALTER TABLE students_hub.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE students_hub.checklist_items ENABLE ROW LEVEL SECURITY;

-- Checklists policies
CREATE POLICY checklists_select_policy ON students_hub.checklists
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY checklists_insert_policy ON students_hub.checklists
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY checklists_update_policy ON students_hub.checklists
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY checklists_delete_policy ON students_hub.checklists
  FOR DELETE USING (auth.uid() = user_id);

-- Checklist items policies (based on checklist ownership)
CREATE POLICY checklist_items_select_policy ON students_hub.checklist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students_hub.checklists c
      WHERE c.id = checklist_id AND c.user_id = auth.uid()
    )
  );
  
CREATE POLICY checklist_items_insert_policy ON students_hub.checklist_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM students_hub.checklists c
      WHERE c.id = checklist_id AND c.user_id = auth.uid()
    )
  );
  
CREATE POLICY checklist_items_update_policy ON students_hub.checklist_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM students_hub.checklists c
      WHERE c.id = checklist_id AND c.user_id = auth.uid()
    )
  );
  
CREATE POLICY checklist_items_delete_policy ON students_hub.checklist_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM students_hub.checklists c
      WHERE c.id = checklist_id AND c.user_id = auth.uid()
    )
  );
