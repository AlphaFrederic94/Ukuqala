-- Medical Students Hub Database Schema for Supabase
-- Module 3: MCQ Questions

-- ===============================
-- MCQ QUESTIONS TABLES
-- ===============================
CREATE TABLE students_hub.mcq_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES students_hub.subjects(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  explanation TEXT,
  image_url TEXT,
  difficulty VARCHAR(10) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE students_hub.mcq_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES students_hub.mcq_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE students_hub.mcq_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES students_hub.mcq_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES students_hub.mcq_options(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================
-- MCQ QUESTIONS FUNCTIONS
-- ===============================

-- Function to get random MCQ questions by subject and difficulty
CREATE OR REPLACE FUNCTION students_hub.get_random_mcq_questions(
  p_user_id UUID,
  p_subject_id UUID DEFAULT NULL,
  p_difficulty VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  question TEXT,
  explanation TEXT,
  image_url TEXT,
  subject_name TEXT,
  difficulty VARCHAR,
  options JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH question_data AS (
    SELECT
      q.id,
      q.question,
      q.explanation,
      q.image_url,
      s.name AS subject_name,
      q.difficulty,
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', o.id,
            'text', o.option_text,
            'is_correct', o.is_correct
          )
        )
        FROM students_hub.mcq_options o
        WHERE o.question_id = q.id
      ) AS options
    FROM
      students_hub.mcq_questions q
    LEFT JOIN
      students_hub.subjects s ON q.subject_id = s.id
    WHERE
      (p_subject_id IS NULL OR q.subject_id = p_subject_id)
      AND (p_difficulty IS NULL OR q.difficulty = p_difficulty)
    ORDER BY
      RANDOM()
    LIMIT p_limit
  )
  SELECT * FROM question_data;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- MCQ QUESTIONS VIEWS
-- ===============================

-- View for MCQ statistics
CREATE OR REPLACE VIEW students_hub.mcq_stats AS
SELECT
  user_id,
  COUNT(DISTINCT question_id) AS total_questions_attempted,
  COUNT(DISTINCT CASE WHEN is_correct THEN question_id END) AS correct_questions,
  ROUND(COUNT(CASE WHEN is_correct THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) AS accuracy_percentage
FROM
  students_hub.mcq_attempts
GROUP BY
  user_id;

-- ===============================
-- MCQ QUESTIONS INDEXES
-- ===============================
CREATE INDEX IF NOT EXISTS idx_mcq_questions_user_id ON students_hub.mcq_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_mcq_questions_subject_id ON students_hub.mcq_questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_mcq_options_question_id ON students_hub.mcq_options(question_id);
CREATE INDEX IF NOT EXISTS idx_mcq_attempts_user_id ON students_hub.mcq_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_mcq_attempts_question_id ON students_hub.mcq_attempts(question_id);

-- ===============================
-- MCQ QUESTIONS RLS POLICIES
-- ===============================
ALTER TABLE students_hub.mcq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students_hub.mcq_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE students_hub.mcq_attempts ENABLE ROW LEVEL SECURITY;

-- MCQ questions policies
CREATE POLICY mcq_questions_select_policy ON students_hub.mcq_questions
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY mcq_questions_insert_policy ON students_hub.mcq_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY mcq_questions_update_policy ON students_hub.mcq_questions
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY mcq_questions_delete_policy ON students_hub.mcq_questions
  FOR DELETE USING (auth.uid() = user_id);

-- MCQ options policies (based on question ownership)
CREATE POLICY mcq_options_select_policy ON students_hub.mcq_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students_hub.mcq_questions q
      WHERE q.id = question_id AND q.user_id = auth.uid()
    )
  );
  
CREATE POLICY mcq_options_insert_policy ON students_hub.mcq_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM students_hub.mcq_questions q
      WHERE q.id = question_id AND q.user_id = auth.uid()
    )
  );
  
CREATE POLICY mcq_options_update_policy ON students_hub.mcq_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM students_hub.mcq_questions q
      WHERE q.id = question_id AND q.user_id = auth.uid()
    )
  );
  
CREATE POLICY mcq_options_delete_policy ON students_hub.mcq_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM students_hub.mcq_questions q
      WHERE q.id = question_id AND q.user_id = auth.uid()
    )
  );

-- MCQ attempts policies
CREATE POLICY mcq_attempts_select_policy ON students_hub.mcq_attempts
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY mcq_attempts_insert_policy ON students_hub.mcq_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY mcq_attempts_update_policy ON students_hub.mcq_attempts
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY mcq_attempts_delete_policy ON students_hub.mcq_attempts
  FOR DELETE USING (auth.uid() = user_id);
