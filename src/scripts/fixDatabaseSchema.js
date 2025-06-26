import { supabase } from '../lib/supabaseClient';

// This script checks and fixes the database schema for social features
// Run this script once to ensure the database schema is correct

const fixDatabaseSchema = async () => {
  try {
    // Silently check if chat_messages table has the correct columns
    const { data: chatMessagesColumns, error: chatMessagesError } = await supabase
      .rpc('get_column_names', { table_name: 'chat_messages' });

    if (chatMessagesError) {
      // Silently handle errors
      return;
    }

    // Check if we need to rename receiver_id to recipient_id
    if (
      chatMessagesColumns.includes('receiver_id') &&
      !chatMessagesColumns.includes('recipient_id')
    ) {
      // Silently rename the column

      // Create a new column
      const { error: addColumnError } = await supabase.rpc('execute_sql', {
        sql: 'ALTER TABLE public.chat_messages ADD COLUMN recipient_id UUID REFERENCES auth.users(id)'
      });

      if (addColumnError) {
        // Silently handle errors
        return;
      }

      // Copy data from old column to new column
      const { error: copyDataError } = await supabase.rpc('execute_sql', {
        sql: 'UPDATE public.chat_messages SET recipient_id = receiver_id'
      });

      if (copyDataError) {
        // Silently handle errors
        return;
      }

      // Drop the old column
      const { error: dropColumnError } = await supabase.rpc('execute_sql', {
        sql: 'ALTER TABLE public.chat_messages DROP COLUMN receiver_id'
      });

      if (dropColumnError) {
        // Silently handle errors
        return;
      }
    }

    // Check if we need to rename read to is_read
    if (
      chatMessagesColumns.includes('read') &&
      !chatMessagesColumns.includes('is_read')
    ) {
      // Silently rename the column

      // Create a new column
      const { error: addColumnError } = await supabase.rpc('execute_sql', {
        sql: 'ALTER TABLE public.chat_messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE'
      });

      if (addColumnError) {
        // Silently handle errors
        return;
      }

      // Copy data from old column to new column
      const { error: copyDataError } = await supabase.rpc('execute_sql', {
        sql: 'UPDATE public.chat_messages SET is_read = read'
      });

      if (copyDataError) {
        // Silently handle errors
        return;
      }

      // Drop the old column
      const { error: dropColumnError } = await supabase.rpc('execute_sql', {
        sql: 'ALTER TABLE public.chat_messages DROP COLUMN read'
      });

      if (dropColumnError) {
        // Silently handle errors
        return;
      }
    }
  } catch (error) {
    // Silently handle errors
  }
};

export default fixDatabaseSchema;
