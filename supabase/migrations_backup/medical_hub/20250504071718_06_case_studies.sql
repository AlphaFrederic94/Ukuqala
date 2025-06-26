-- Medical Students Hub Database Schema for Supabase
-- Module 6: Case Studies

-- ===============================
-- CASE STUDIES TABLES
-- ===============================
CREATE TABLE students_hub.case_studies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  patient_info TEXT NOT NULL,
  history TEXT NOT NULL,
  examination TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  treatment TEXT NOT NULL,
  difficulty VARCHAR(10) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE students_hub.case_symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES students_hub.case_studies(id) ON DELETE CASCADE,
  symptom TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE students_hub.case_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES students_hub.case_studies(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE students_hub.case_question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES students_hub.case_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE students_hub.case_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES students_hub.case_studies(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE students_hub.case_question_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES students_hub.case_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES students_hub.case_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES students_hub.case_question_options(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================
-- CASE STUDIES FUNCTIONS
-- ===============================

-- Function to get case study with all related data
CREATE OR REPLACE FUNCTION students_hub.get_case_study_details(p_case_id UUID)
RETURNS TABLE (
  case_data JSONB,
  symptoms JSONB,
  questions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Case data
    jsonb_build_object(
      'id', c.id,
      'title', c.title,
      'category', c.category,
      'patient_info', c.patient_info,
      'history', c.history,
      'examination', c.examination,
      'diagnosis', c.diagnosis,
      'treatment', c.treatment,
      'difficulty', c.difficulty,
      'image_url', c.image_url,
      'created_at', c.created_at,
      'updated_at', c.updated_at
    ) AS case_data,
    
    -- Symptoms
    COALESCE(
      (
        SELECT jsonb_agg(s.symptom)
        FROM students_hub.case_symptoms s
        WHERE s.case_id = c.id
      ),
      '[]'::jsonb
    ) AS symptoms,
    
    -- Questions with options
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', q.id,
            'question', q.question,
            'explanation', q.explanation,
            'options', (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', o.id,
                  'text', o.option_text,
                  'is_correct', o.is_correct
                )
              )
              FROM students_hub.case_question_options o
              WHERE o.question_id = q.id
            )
          )
        )
        FROM students_hub.case_questions q
        WHERE q.case_id = c.id
      ),
      '[]'::jsonb
    ) AS questions
  FROM
    students_hub.case_studies c
  WHERE
    c.id = p_case_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get case studies with filtering
CREATE OR REPLACE FUNCTION students_hub.get_case_studies(
  p_user_id UUID,
  p_category TEXT DEFAULT NULL,
  p_difficulty VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category TEXT,
  patient_info TEXT,
  difficulty VARCHAR,
  image_url TEXT,
  symptoms TEXT[],
  question_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  has_attempted BOOLEAN,
  best_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.category,
    c.patient_info,
    c.difficulty,
    c.image_url,
    ARRAY(
      SELECT s.symptom
      FROM students_hub.case_symptoms s
      WHERE s.case_id = c.id
    ) AS symptoms,
    (
      SELECT COUNT(*)::INTEGER
      FROM students_hub.case_questions q
      WHERE q.case_id = c.id
    ) AS question_count,
    c.created_at,
    (
      SELECT EXISTS (
        SELECT 1
        FROM students_hub.case_attempts a
        WHERE a.case_id = c.id AND a.user_id = p_user_id
      )
    ) AS has_attempted,
    (
      SELECT MAX(a.score)
      FROM students_hub.case_attempts a
      WHERE a.case_id = c.id AND a.user_id = p_user_id AND a.completed = TRUE
    ) AS best_score
  FROM
    students_hub.case_studies c
  WHERE
    (p_category IS NULL OR c.category = p_category)
    AND (p_difficulty IS NULL OR c.difficulty = p_difficulty)
  ORDER BY
    c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to record a case study attempt
CREATE OR REPLACE FUNCTION students_hub.record_case_attempt(
  p_user_id UUID,
  p_case_id UUID,
  p_answers JSONB -- Array of {question_id, selected_option_id}
)
RETURNS TABLE (
  attempt_id UUID,
  score INTEGER,
  total_questions INTEGER,
  correct_answers INTEGER
) AS $$
DECLARE
  v_attempt_id UUID;
  v_correct_count INTEGER := 0;
  v_total_count INTEGER := 0;
  v_score INTEGER;
  v_answer JSONB;
  v_question_id UUID;
  v_selected_option_id UUID;
  v_is_correct BOOLEAN;
BEGIN
  -- Create the attempt record
  INSERT INTO students_hub.case_attempts (
    user_id,
    case_id,
    score,
    completed,
    completed_at
  ) VALUES (
    p_user_id,
    p_case_id,
    0, -- Will update this after calculating
    TRUE,
    NOW()
  ) RETURNING id INTO v_attempt_id;
  
  -- Process each answer
  FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    v_question_id := (v_answer->>'question_id')::UUID;
    v_selected_option_id := (v_answer->>'selected_option_id')::UUID;
    
    -- Check if the answer is correct
    SELECT is_correct INTO v_is_correct
    FROM students_hub.case_question_options
    WHERE id = v_selected_option_id;
    
    -- Record the answer
    INSERT INTO students_hub.case_question_answers (
      attempt_id,
      question_id,
      selected_option_id,
      is_correct
    ) VALUES (
      v_attempt_id,
      v_question_id,
      v_selected_option_id,
      v_is_correct
    );
    
    -- Update counters
    v_total_count := v_total_count + 1;
    IF v_is_correct THEN
      v_correct_count := v_correct_count + 1;
    END IF;
  END LOOP;
  
  -- Calculate score (percentage)
  IF v_total_count > 0 THEN
    v_score := (v_correct_count * 100) / v_total_count;
  ELSE
    v_score := 0;
  END IF;
  
  -- Update the attempt with the final score
  UPDATE students_hub.case_attempts
  SET score = v_score
  WHERE id = v_attempt_id;
  
  -- Return the results
  RETURN QUERY
  SELECT
    v_attempt_id,
    v_score,
    v_total_count,
    v_correct_count;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- CASE STUDIES VIEWS
-- ===============================

-- View for case study statistics
CREATE OR REPLACE VIEW students_hub.case_study_stats AS
SELECT
  user_id,
  COUNT(DISTINCT case_id) AS total_cases_attempted,
  COUNT(DISTINCT CASE WHEN completed THEN case_id END) AS completed_cases,
  AVG(score) AS avg_score
FROM
  students_hub.case_attempts
GROUP BY
  user_id;

-- ===============================
-- CASE STUDIES INDEXES
-- ===============================
CREATE INDEX IF NOT EXISTS idx_case_studies_user_id ON students_hub.case_studies(user_id);
CREATE INDEX IF NOT EXISTS idx_case_studies_category ON students_hub.case_studies(category);
CREATE INDEX IF NOT EXISTS idx_case_studies_difficulty ON students_hub.case_studies(difficulty);
CREATE INDEX IF NOT EXISTS idx_case_symptoms_case_id ON students_hub.case_symptoms(case_id);
CREATE INDEX IF NOT EXISTS idx_case_questions_case_id ON students_hub.case_questions(case_id);
CREATE INDEX IF NOT EXISTS idx_case_question_options_question_id ON students_hub.case_question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_case_attempts_user_id ON students_hub.case_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_case_attempts_case_id ON students_hub.case_attempts(case_id);
CREATE INDEX IF NOT EXISTS idx_case_question_answers_attempt_id ON students_hub.case_question_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_case_question_answers_question_id ON students_hub.case_question_answers(question_id);

-- ===============================
-- CASE STUDIES RLS POLICIES
-- ===============================
ALTER TABLE students_hub.case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE students_hub.case_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE students_hub.case_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students_hub.case_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE students_hub.case_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE students_hub.case_question_answers ENABLE ROW LEVEL SECURITY;

-- Case studies policies
CREATE POLICY case_studies_select_policy ON students_hub.case_studies
  FOR SELECT USING (TRUE); -- Allow all users to view case studies
  
CREATE POLICY case_studies_insert_policy ON students_hub.case_studies
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY case_studies_update_policy ON students_hub.case_studies
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY case_studies_delete_policy ON students_hub.case_studies
  FOR DELETE USING (auth.uid() = user_id);

-- Case symptoms policies
CREATE POLICY case_symptoms_select_policy ON students_hub.case_symptoms
  FOR SELECT USING (TRUE); -- Allow all users to view symptoms
  
CREATE POLICY case_symptoms_insert_policy ON students_hub.case_symptoms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM students_hub.case_studies c
      WHERE c.id = case_id AND c.user_id = auth.uid()
    )
  );
  
CREATE POLICY case_symptoms_update_policy ON students_hub.case_symptoms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM students_hub.case_studies c
      WHERE c.id = case_id AND c.user_id = auth.uid()
    )
  );
  
CREATE POLICY case_symptoms_delete_policy ON students_hub.case_symptoms
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM students_hub.case_studies c
      WHERE c.id = case_id AND c.user_id = auth.uid()
    )
  );

-- Similar policies for other case study related tables
-- Case questions policies
CREATE POLICY case_questions_select_policy ON students_hub.case_questions
  FOR SELECT USING (TRUE);

-- Case attempts policies
CREATE POLICY case_attempts_select_policy ON students_hub.case_attempts
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY case_attempts_insert_policy ON students_hub.case_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
