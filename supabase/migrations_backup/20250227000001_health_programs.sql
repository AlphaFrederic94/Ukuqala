-- Health Programs Tables
CREATE TABLE health_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL,
  body_type TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL,
  progress FLOAT DEFAULT 0,
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE program_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES health_programs NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  metrics JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_health_programs_user ON health_programs(user_id);
CREATE INDEX idx_program_progress_program ON program_progress(program_id);
CREATE INDEX idx_program_progress_date ON program_progress(date);

-- RLS Policies
ALTER TABLE health_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own health programs"
  ON health_programs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own program progress"
  ON program_progress
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM health_programs 
      WHERE id = program_progress.program_id
    )
  );