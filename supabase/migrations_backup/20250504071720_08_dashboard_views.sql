-- Medical Students Hub Database Schema for Supabase
-- Module 8: Dashboard Views and Aggregated Statistics

-- ===============================
-- DASHBOARD VIEWS
-- ===============================

-- View for overall user statistics across all modules
CREATE OR REPLACE VIEW students_hub.user_dashboard_stats AS
SELECT
  u.id AS user_id,
  
  -- Flashcards stats
  COALESCE(f.total_flashcards, 0) AS total_flashcards,
  COALESCE(f.reviewed_flashcards, 0) AS reviewed_flashcards,
  COALESCE(f.avg_difficulty, 0) AS avg_flashcard_difficulty,
  
  -- MCQ stats
  COALESCE(m.total_questions_attempted, 0) AS total_mcq_attempted,
  COALESCE(m.correct_questions, 0) AS correct_mcq_questions,
  COALESCE(m.accuracy_percentage, 0) AS mcq_accuracy_percentage,
  
  -- Notes stats
  (
    SELECT COUNT(*)
    FROM students_hub.notes n
    WHERE n.user_id = u.id
  ) AS total_notes,
  
  -- Checklists stats
  (
    SELECT COUNT(*)
    FROM students_hub.checklists c
    WHERE c.user_id = u.id
  ) AS total_checklists,
  (
    SELECT COUNT(*)
    FROM students_hub.checklists c
    JOIN students_hub.checklist_items i ON c.id = i.checklist_id
    WHERE c.user_id = u.id
  ) AS total_checklist_items,
  (
    SELECT COUNT(*)
    FROM students_hub.checklists c
    JOIN students_hub.checklist_items i ON c.id = i.checklist_id
    WHERE c.user_id = u.id AND i.completed = TRUE
  ) AS completed_checklist_items,
  
  -- Case studies stats
  COALESCE(cs.total_cases_attempted, 0) AS total_cases_attempted,
  COALESCE(cs.completed_cases, 0) AS completed_cases,
  COALESCE(cs.avg_score, 0) AS avg_case_score,
  
  -- Exam roadmaps stats
  (
    SELECT COUNT(*)
    FROM students_hub.exam_roadmaps r
    WHERE r.user_id = u.id
  ) AS total_roadmaps,
  (
    SELECT COUNT(*)
    FROM students_hub.exam_roadmaps r
    JOIN students_hub.roadmap_milestones m ON r.id = m.roadmap_id
    WHERE r.user_id = u.id
  ) AS total_milestones,
  (
    SELECT COUNT(*)
    FROM students_hub.exam_roadmaps r
    JOIN students_hub.roadmap_milestones m ON r.id = m.roadmap_id
    WHERE r.user_id = u.id AND m.completed = TRUE
  ) AS completed_milestones,
  
  -- Study time stats
  (
    SELECT COALESCE(SUM(duration), 0)
    FROM students_hub.study_sessions s
    WHERE s.user_id = u.id
  ) AS total_study_minutes,
  
  -- Last activity
  (
    SELECT MAX(s.start_time)
    FROM students_hub.study_sessions s
    WHERE s.user_id = u.id
  ) AS last_activity
FROM
  public.users u
LEFT JOIN
  students_hub.flashcard_stats f ON u.id = f.user_id
LEFT JOIN
  students_hub.mcq_stats m ON u.id = m.user_id
LEFT JOIN
  students_hub.case_study_stats cs ON u.id = cs.user_id;

-- View for upcoming due items (combined from checklists and roadmaps)
CREATE OR REPLACE VIEW students_hub.upcoming_due_items AS
SELECT
  'checklist' AS item_type,
  i.id AS item_id,
  c.id AS parent_id,
  c.title AS parent_title,
  i.title AS item_title,
  i.due_date,
  EXTRACT(DAY FROM i.due_date - NOW())::INTEGER AS days_until_due,
  c.user_id
FROM
  students_hub.checklist_items i
JOIN
  students_hub.checklists c ON i.checklist_id = c.id
WHERE
  i.due_date IS NOT NULL
  AND i.due_date > NOW()
  AND NOT i.completed

UNION ALL

SELECT
  'roadmap' AS item_type,
  m.id AS item_id,
  r.id AS parent_id,
  r.title AS parent_title,
  m.title AS item_title,
  m.due_date,
  EXTRACT(DAY FROM m.due_date - NOW())::INTEGER AS days_until_due,
  r.user_id
FROM
  students_hub.roadmap_milestones m
JOIN
  students_hub.exam_roadmaps r ON m.roadmap_id = r.id
WHERE
  m.due_date IS NOT NULL
  AND m.due_date > NOW()
  AND NOT m.completed;

-- View for study activity by module
CREATE OR REPLACE VIEW students_hub.study_activity_by_module AS
SELECT
  user_id,
  module,
  COUNT(*) AS session_count,
  SUM(duration) AS total_minutes,
  AVG(duration) AS avg_session_minutes,
  MAX(start_time) AS last_session
FROM
  students_hub.study_sessions
GROUP BY
  user_id, module;

-- View for weekly study activity
CREATE OR REPLACE VIEW students_hub.weekly_study_activity AS
SELECT
  user_id,
  DATE_TRUNC('week', start_time) AS week_start,
  SUM(duration) AS total_minutes,
  COUNT(*) AS session_count
FROM
  students_hub.study_sessions
GROUP BY
  user_id, DATE_TRUNC('week', start_time)
ORDER BY
  user_id, week_start DESC;

-- ===============================
-- DASHBOARD FUNCTIONS
-- ===============================

-- Function to get user dashboard data
CREATE OR REPLACE FUNCTION students_hub.get_user_dashboard(p_user_id UUID)
RETURNS TABLE (
  stats JSONB,
  upcoming_items JSONB,
  recent_activity JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- User stats
    (
      SELECT jsonb_build_object(
        'total_flashcards', total_flashcards,
        'reviewed_flashcards', reviewed_flashcards,
        'total_mcq_attempted', total_mcq_attempted,
        'mcq_accuracy_percentage', mcq_accuracy_percentage,
        'total_notes', total_notes,
        'total_checklists', total_checklists,
        'completed_checklist_items', completed_checklist_items,
        'total_checklist_items', total_checklist_items,
        'total_cases_attempted', total_cases_attempted,
        'avg_case_score', avg_case_score,
        'total_roadmaps', total_roadmaps,
        'completed_milestones', completed_milestones,
        'total_milestones', total_milestones,
        'total_study_hours', ROUND(total_study_minutes / 60.0, 1)
      )
      FROM students_hub.user_dashboard_stats
      WHERE user_id = p_user_id
    ) AS stats,
    
    -- Upcoming items (next 7 days)
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'type', item_type,
          'title', item_title,
          'parent_title', parent_title,
          'due_date', due_date,
          'days_until_due', days_until_due
        )
      )
      FROM students_hub.upcoming_due_items
      WHERE user_id = p_user_id
      AND days_until_due <= 7
      ORDER BY due_date ASC
      LIMIT 10
    ) AS upcoming_items,
    
    -- Recent activity
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'module', module,
          'start_time', start_time,
          'duration', duration,
          'duration_minutes', duration
        )
      )
      FROM students_hub.study_sessions
      WHERE user_id = p_user_id
      ORDER BY start_time DESC
      LIMIT 10
    ) AS recent_activity;
END;
$$ LANGUAGE plpgsql;
