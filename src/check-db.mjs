import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://gzeeaqiimsmpiocvnzuj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6ZWVhcWlpbXNtcGlvY3ZuenVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5NzI1NzYsImV4cCI6MjAxNTU0ODU3Nn0.Wd_tBYKF5zS3QXRJ_gQNKYFcLrT5kwd3-YQfTJnXIFw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('Checking chat_groups table...');
  const { data: groups, error: groupsError } = await supabase
    .from('chat_groups')
    .select('*')
    .limit(10);
  
  if (groupsError) {
    console.error('Error fetching chat_groups:', groupsError);
  } else {
    console.log('chat_groups data:', groups);
  }

  console.log('\nChecking chat_group_members table...');
  const { data: members, error: membersError } = await supabase
    .from('chat_group_members')
    .select('*')
    .limit(10);
  
  if (membersError) {
    console.error('Error fetching chat_group_members:', membersError);
  } else {
    console.log('chat_group_members data:', members);
  }

  console.log('\nChecking chat_group_messages table...');
  const { data: messages, error: messagesError } = await supabase
    .from('chat_group_messages')
    .select('*')
    .limit(10);
  
  if (messagesError) {
    console.error('Error fetching chat_group_messages:', messagesError);
  } else {
    console.log('chat_group_messages data:', messages);
  }
}

checkDatabase();
