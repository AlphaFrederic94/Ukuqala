import { supabase } from '../lib/supabaseClient';

// This script checks if all required tables exist in the database
// It doesn't create tables, just checks if they exist

const checkDatabaseTables = async () => {
  try {
    // Check if all required tables exist by directly querying them
    const requiredTables = [
      'chat_groups',
      'chat_group_members',
      'chat_group_messages',
      'chat_messages',
      'user_friendships',
      'social_posts',
      'post_likes',
      'post_comments',
      'notifications',
      'profiles'
    ];

    // Check each table individually
    for (const table of requiredTables) {
      try {
        // Try to count records in the table
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        // If there's an error, the table might not exist
        if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
          return false;
        }
      } catch (error) {
        // If any table check fails, return false
        return false;
      }
    }

    return true;
  } catch (error) {
    // Silently handle errors
    return false;
  }
};

export default checkDatabaseTables;
