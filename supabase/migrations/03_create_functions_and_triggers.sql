-- Create functions and triggers for Student Hub
-- Run this script in the Supabase SQL Editor after creating the tables

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER set_updated_at_student_hub_notes
BEFORE UPDATE ON student_hub_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_student_hub_roadmaps
BEFORE UPDATE ON student_hub_roadmaps
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_student_hub_milestones
BEFORE UPDATE ON student_hub_milestones
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to create a user dashboard when a new user is created
CREATE OR REPLACE FUNCTION create_user_dashboard()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_hub_user_dashboard (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create user dashboard when a new user is created
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_dashboard();

-- Function to get notes by tag
CREATE OR REPLACE FUNCTION get_notes_by_tag(tag_name TEXT)
RETURNS SETOF student_hub_notes AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM student_hub_notes
  WHERE tag_name = ANY(tags)
  AND user_id = auth.uid()
  ORDER BY updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get notes by subject
CREATE OR REPLACE FUNCTION get_notes_by_subject(subject_name TEXT)
RETURNS SETOF student_hub_notes AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM student_hub_notes
  WHERE subject = subject_name
  AND user_id = auth.uid()
  ORDER BY updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to search notes
CREATE OR REPLACE FUNCTION search_notes(search_query TEXT)
RETURNS SETOF student_hub_notes AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM student_hub_notes
  WHERE (
    title ILIKE '%' || search_query || '%'
    OR content ILIKE '%' || search_query || '%'
    OR subject ILIKE '%' || search_query || '%'
    OR search_query = ANY(tags)
  )
  AND user_id = auth.uid()
  ORDER BY updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to toggle note favorite status
CREATE OR REPLACE FUNCTION toggle_note_favorite(note_id UUID)
RETURNS student_hub_notes AS $$
DECLARE
  updated_note student_hub_notes;
BEGIN
  UPDATE student_hub_notes
  SET is_favorite = NOT is_favorite,
      updated_at = NOW()
  WHERE id = note_id
  AND user_id = auth.uid()
  RETURNING * INTO updated_note;
  
  RETURN updated_note;
END;
$$ LANGUAGE plpgsql;

-- Function to toggle milestone completion status
CREATE OR REPLACE FUNCTION toggle_milestone_completion(milestone_id UUID)
RETURNS student_hub_milestones AS $$
DECLARE
  updated_milestone student_hub_milestones;
BEGIN
  UPDATE student_hub_milestones
  SET completed = NOT completed,
      updated_at = NOW()
  WHERE id = milestone_id
  AND roadmap_id IN (
    SELECT id FROM student_hub_roadmaps WHERE user_id = auth.uid()
  )
  RETURNING * INTO updated_milestone;
  
  RETURN updated_milestone;
END;
$$ LANGUAGE plpgsql;

-- Function to get roadmaps by exam type
CREATE OR REPLACE FUNCTION get_roadmaps_by_exam_type(exam_type_name TEXT)
RETURNS SETOF student_hub_roadmaps AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM student_hub_roadmaps
  WHERE exam_type = exam_type_name
  AND user_id = auth.uid()
  ORDER BY exam_date ASC;
END;
$$ LANGUAGE plpgsql;
