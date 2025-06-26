-- Medical Students Hub Database Schema for Supabase
-- Module 2: Flashcards

-- ===============================
-- FLASHCARDS TABLES
-- ===============================
CREATE TABLE students_hub.flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES students_hub.subjects(id) ON DELETE SET NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  image_url TEXT,
  difficulty_rating INTEGER DEFAULT 3 CHECK (difficulty_rating BETWEEN 1 AND 5),
  last_reviewed TIMESTAMP WITH TIME ZONE,
  next_review TIMESTAMP WITH TIME ZONE,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================
-- FLASHCARDS FUNCTIONS
-- ===============================

-- Function to get due flashcards for spaced repetition
CREATE OR REPLACE FUNCTION students_hub.get_due_flashcards(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  front TEXT,
  back TEXT,
  subject_name TEXT,
  difficulty_rating INTEGER,
  days_since_review INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.front,
    f.back,
    s.name AS subject_name,
    f.difficulty_rating,
    EXTRACT(DAY FROM NOW() - COALESCE(f.last_reviewed, f.created_at))::INTEGER AS days_since_review
  FROM
    students_hub.flashcards f
  LEFT JOIN
    students_hub.subjects s ON f.subject_id = s.id
  WHERE
    f.user_id = p_user_id
    AND (f.next_review IS NULL OR f.next_review <= NOW())
  ORDER BY
    f.next_review NULLS FIRST,
    days_since_review DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to update flashcard review schedule based on difficulty rating
CREATE OR REPLACE FUNCTION students_hub.update_flashcard_schedule()
RETURNS TRIGGER AS $$
DECLARE
  interval_days INTEGER;
BEGIN
  -- Calculate next review date based on difficulty rating and review count
  -- Using a simplified spaced repetition algorithm
  CASE
    WHEN NEW.difficulty_rating = 1 THEN interval_days := 1; -- Hard - review tomorrow
    WHEN NEW.difficulty_rating = 2 THEN interval_days := 3; -- Somewhat hard - review in 3 days
    WHEN NEW.difficulty_rating = 3 THEN interval_days := 7; -- Medium - review in a week
    WHEN NEW.difficulty_rating = 4 THEN interval_days := 14; -- Somewhat easy - review in 2 weeks
    WHEN NEW.difficulty_rating = 5 THEN interval_days := 30; -- Easy - review in a month
    ELSE interval_days := 7; -- Default to a week
  END CASE;
  
  -- Adjust interval based on review count (the more reviews, the longer the interval)
  interval_days := interval_days * (1 + NEW.review_count / 10);
  
  -- Update next review date
  NEW.next_review := NOW() + (interval_days * INTERVAL '1 day');
  NEW.last_reviewed := NOW();
  NEW.review_count := NEW.review_count + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- FLASHCARDS TRIGGERS
-- ===============================

-- Trigger to update flashcard schedule when difficulty rating is updated
CREATE TRIGGER update_flashcard_schedule_trigger
BEFORE UPDATE OF difficulty_rating ON students_hub.flashcards
FOR EACH ROW
WHEN (OLD.difficulty_rating IS DISTINCT FROM NEW.difficulty_rating)
EXECUTE FUNCTION students_hub.update_flashcard_schedule();

-- ===============================
-- FLASHCARDS VIEWS
-- ===============================

-- View for flashcard statistics
CREATE OR REPLACE VIEW students_hub.flashcard_stats AS
SELECT
  user_id,
  COUNT(*) AS total_flashcards,
  COUNT(CASE WHEN last_reviewed IS NOT NULL THEN 1 END) AS reviewed_flashcards,
  AVG(difficulty_rating) AS avg_difficulty,
  MAX(last_reviewed) AS last_study_session
FROM
  students_hub.flashcards
GROUP BY
  user_id;

-- ===============================
-- FLASHCARDS INDEXES
-- ===============================
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON students_hub.flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_subject_id ON students_hub.flashcards(subject_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON students_hub.flashcards(next_review);

-- ===============================
-- FLASHCARDS RLS POLICIES
-- ===============================
ALTER TABLE students_hub.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY flashcards_select_policy ON students_hub.flashcards
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY flashcards_insert_policy ON students_hub.flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY flashcards_update_policy ON students_hub.flashcards
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY flashcards_delete_policy ON students_hub.flashcards
  FOR DELETE USING (auth.uid() = user_id);
