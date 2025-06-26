-- Seed data for peer forum

-- Insert default servers
INSERT INTO peer_forum.servers (id, name, description, icon, is_default, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Medical Students Hub', 'The main hub for all medical students', '🏥', TRUE, NOW()),
  ('00000000-0000-0000-0000-000000000002', 'Anatomy', 'Discuss human anatomy topics', '🧠', FALSE, NOW()),
  ('00000000-0000-0000-0000-000000000003', 'Pathology', 'Share and discuss pathology cases', '🔬', FALSE, NOW()),
  ('00000000-0000-0000-0000-000000000004', 'Pharmacology', 'Learn about drugs and their mechanisms', '💊', FALSE, NOW()),
  ('00000000-0000-0000-0000-000000000005', 'Clinical Skills', 'Practice and discuss clinical skills', '👨‍⚕️', FALSE, NOW()),
  ('00000000-0000-0000-0000-000000000006', 'USMLE Prep', 'Prepare for USMLE exams together', '📚', FALSE, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert default channels for the main server
INSERT INTO peer_forum.channels (id, server_id, name, description, type, category, position, created_at)
VALUES
  -- INFORMATION category
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'welcome', 'Welcome to the Medical Students Hub', 'text', 'INFORMATION', 0, NOW()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'announcements', 'Important announcements', 'text', 'INFORMATION', 1, NOW()),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'rules', 'Community rules and guidelines', 'text', 'INFORMATION', 2, NOW()),
  
  -- TEXT CHANNELS category
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'general', 'General discussion', 'text', 'TEXT CHANNELS', 0, NOW()),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'study-tips', 'Share your study tips and techniques', 'text', 'TEXT CHANNELS', 1, NOW()),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'resources', 'Share useful resources', 'text', 'TEXT CHANNELS', 2, NOW()),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'case-discussions', 'Discuss interesting medical cases', 'text', 'TEXT CHANNELS', 3, NOW()),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'memes', 'Medical memes and humor', 'text', 'TEXT CHANNELS', 4, NOW()),
  
  -- VOICE CHANNELS category
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'study-room', 'Voice channel for study sessions', 'voice', 'VOICE CHANNELS', 0, NOW()),
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'lounge', 'Casual voice chat', 'voice', 'VOICE CHANNELS', 1, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert channels for Anatomy server
INSERT INTO peer_forum.channels (id, server_id, name, description, type, category, position, created_at)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'welcome', 'Welcome to the Anatomy server', 'text', 'INFORMATION', 0, NOW()),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'general', 'General anatomy discussion', 'text', 'TEXT CHANNELS', 0, NOW()),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'neuroanatomy', 'Brain and nervous system anatomy', 'text', 'TEXT CHANNELS', 1, NOW()),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'musculoskeletal', 'Muscles, bones, and joints', 'text', 'TEXT CHANNELS', 2, NOW()),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'cardiovascular', 'Heart and blood vessels', 'text', 'TEXT CHANNELS', 3, NOW()),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'study-voice', 'Voice channel for anatomy study', 'voice', 'VOICE CHANNELS', 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert channels for Pathology server
INSERT INTO peer_forum.channels (id, server_id, name, description, type, category, position, created_at)
VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'welcome', 'Welcome to the Pathology server', 'text', 'INFORMATION', 0, NOW()),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'general', 'General pathology discussion', 'text', 'TEXT CHANNELS', 0, NOW()),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'case-sharing', 'Share interesting pathology cases', 'text', 'TEXT CHANNELS', 1, NOW()),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'histopathology', 'Histopathology slides and discussion', 'text', 'TEXT CHANNELS', 2, NOW()),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'study-voice', 'Voice channel for pathology study', 'voice', 'VOICE CHANNELS', 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample welcome message
INSERT INTO peer_forum.messages (id, channel_id, content, is_pinned, created_at, user_id)
VALUES (
  '90000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Welcome to the Medical Students Hub! This is a community for medical students to connect, share knowledge, and support each other through the journey of medical education. Feel free to introduce yourself in the #general channel!',
  TRUE,
  NOW(),
  (SELECT id FROM auth.users LIMIT 1)
)
ON CONFLICT (id) DO NOTHING;

-- Create function to add a user to all servers
CREATE OR REPLACE FUNCTION peer_forum.join_all_servers(user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO peer_forum.server_members (server_id, user_id, role)
  SELECT id, user_id, 
    CASE 
      WHEN id = '00000000-0000-0000-0000-000000000001' THEN 'admin'::TEXT
      ELSE 'member'::TEXT
    END
  FROM peer_forum.servers
  ON CONFLICT (server_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add new users to the default server
CREATE OR REPLACE FUNCTION peer_forum.on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO peer_forum.server_members (server_id, user_id, role)
  VALUES ('00000000-0000-0000-0000-000000000001', NEW.id, 'member')
  ON CONFLICT (server_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE peer_forum.on_auth_user_created();

-- Create function to get user profile info
CREATE OR REPLACE FUNCTION peer_forum.get_user_profile(user_id UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  server_count BIGINT,
  message_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.raw_user_meta_data->>'full_name' as username,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    u.created_at,
    (SELECT COUNT(*) FROM peer_forum.server_members sm WHERE sm.user_id = u.id),
    (SELECT COUNT(*) FROM peer_forum.messages m WHERE m.user_id = u.id)
  FROM 
    auth.users u
  WHERE 
    u.id = get_user_profile.user_id;
END;
$$ LANGUAGE plpgsql;
