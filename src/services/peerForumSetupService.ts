import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import createPeerForumTablesDirectly, { checkPeerForumTables } from './createPeerForumTables';

/**
 * Checks if the execute_sql function exists in the database
 * If it doesn't exist, creates it
 */
export const ensureExecuteSqlFunctionExists = async (): Promise<boolean> => {
  try {
    console.log('Checking if execute_sql function exists...');

    // Try to call the function with a simple query
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: 'SELECT 1'
    });

    // If the function exists and works, we're good
    if (!error) {
      console.log('execute_sql function exists and works');
      return true;
    }

    // If the error is not "function doesn't exist", log it and return false
    if (error.message !== 'function execute_sql does not exist') {
      console.error('Error checking execute_sql function:', error);
      return false;
    }

    console.log('execute_sql function does not exist, creating it...');

    // Create the function using raw SQL
    const { error: createError } = await supabase.rpc('create_execute_sql_function');

    if (createError) {
      console.error('Error creating execute_sql function:', createError);

      // Try a different approach - use a direct SQL query
      const { error: directError } = await supabase.from('_direct_sql').select('*').eq('query', `
        CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
        RETURNS VOID AS $$
        BEGIN
          EXECUTE sql_query;
        EXCEPTION
          WHEN OTHERS THEN
            RAISE EXCEPTION 'Error executing SQL: %', SQLERRM;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        GRANT EXECUTE ON FUNCTION execute_sql TO authenticated;
        GRANT EXECUTE ON FUNCTION execute_sql TO anon;
        GRANT EXECUTE ON FUNCTION execute_sql TO service_role;
      `);

      if (directError) {
        console.error('Error creating execute_sql function via direct SQL:', directError);
        return false;
      }
    }

    // Verify the function was created
    const { error: verifyError } = await supabase.rpc('execute_sql', {
      sql_query: 'SELECT 1'
    });

    if (verifyError) {
      console.error('Error verifying execute_sql function:', verifyError);
      return false;
    }

    console.log('execute_sql function created successfully');
    return true;
  } catch (error) {
    console.error('Unexpected error in ensureExecuteSqlFunctionExists:', error);
    return false;
  }
};

/**
 * Ensures that all required peer forum tables exist in the database
 * This is a non-destructive operation that will only create tables if they don't exist
 */
export const ensurePeerForumTablesExist = async (): Promise<boolean> => {
  console.log('Ensuring peer forum tables exist...');

  try {
    // Create peer_forum schema if it doesn't exist
    const { error: schemaError } = await supabase.rpc('execute_sql', {
      sql_query: `CREATE SCHEMA IF NOT EXISTS peer_forum;`
    });

    if (schemaError) {
      console.error('Error creating peer_forum schema:', schemaError);
      return false;
    }

    // Create servers table if it doesn't exist
    const { error: serversError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS peer_forum.servers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          icon TEXT,
          description TEXT,
          is_default BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          created_by UUID
        );
      `
    });

    if (serversError) {
      console.error('Error creating servers table:', serversError);
      return false;
    }

    // Create channels table if it doesn't exist
    const { error: channelsError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS peer_forum.channels (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL CHECK (type IN ('text', 'voice')),
          server_id UUID NOT NULL,
          category TEXT,
          is_private BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          created_by UUID
        );
      `
    });

    if (channelsError) {
      console.error('Error creating channels table:', channelsError);
      return false;
    }

    // Create messages table if it doesn't exist
    const { error: messagesError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS peer_forum.messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          channel_id UUID NOT NULL,
          content TEXT NOT NULL,
          is_pinned BOOLEAN DEFAULT false,
          is_edited BOOLEAN DEFAULT false,
          parent_id UUID,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          user_id UUID NOT NULL
        );
      `
    });

    if (messagesError) {
      console.error('Error creating messages table:', messagesError);
      return false;
    }

    // Create server_members table if it doesn't exist
    const { error: serverMembersError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS peer_forum.server_members (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          server_id UUID NOT NULL,
          user_id UUID NOT NULL,
          role TEXT NOT NULL,
          joined_at TIMESTAMPTZ DEFAULT now(),
          UNIQUE (server_id, user_id)
        );
      `
    });

    if (serverMembersError) {
      console.error('Error creating server_members table:', serverMembersError);
      return false;
    }

    // Create channel_members table if it doesn't exist
    const { error: channelMembersError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS peer_forum.channel_members (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          channel_id UUID NOT NULL,
          user_id UUID NOT NULL,
          joined_at TIMESTAMPTZ DEFAULT now(),
          last_read_at TIMESTAMPTZ DEFAULT now(),
          UNIQUE (channel_id, user_id)
        );
      `
    });

    if (channelMembersError) {
      console.error('Error creating channel_members table:', channelMembersError);
      return false;
    }

    // Create attachments table if it doesn't exist
    const { error: attachmentsError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS peer_forum.attachments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          message_id UUID NOT NULL,
          type TEXT NOT NULL,
          url TEXT,
          name TEXT,
          size BIGINT,
          duration INTEGER,
          created_at TIMESTAMPTZ DEFAULT now(),
          user_id UUID NOT NULL
        );
      `
    });

    if (attachmentsError) {
      console.error('Error creating attachments table:', attachmentsError);
      return false;
    }

    // Create join_channel function if it doesn't exist
    const { error: functionError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION peer_forum.join_channel(
          p_channel_id UUID,
          p_user_id UUID
        )
        RETURNS BOOLEAN AS $$
        DECLARE
          v_server_id UUID;
        BEGIN
          -- Get the server_id for this channel
          SELECT server_id INTO v_server_id
          FROM peer_forum.channels
          WHERE id = p_channel_id;

          -- If channel doesn't exist, return false
          IF v_server_id IS NULL THEN
            RETURN false;
          END IF;

          -- Add user to server_members if not already a member
          INSERT INTO peer_forum.server_members (server_id, user_id, role)
          VALUES (v_server_id, p_user_id, 'member')
          ON CONFLICT (server_id, user_id) DO NOTHING;

          -- Add user to channel_members
          INSERT INTO peer_forum.channel_members (channel_id, user_id)
          VALUES (p_channel_id, p_user_id)
          ON CONFLICT (channel_id, user_id) DO UPDATE
          SET last_read_at = now();

          RETURN true;
        EXCEPTION
          WHEN OTHERS THEN
            RAISE NOTICE 'Error in join_channel: %', SQLERRM;
            RETURN false;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (functionError) {
      console.error('Error creating join_channel function:', functionError);
      return false;
    }

    // Create is_channel_member function if it doesn't exist
    const { error: isMemberFunctionError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION peer_forum.is_channel_member(
          p_channel_id UUID,
          p_user_id UUID
        )
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1
            FROM peer_forum.channel_members
            WHERE channel_id = p_channel_id AND user_id = p_user_id
          );
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (isMemberFunctionError) {
      console.error('Error creating is_channel_member function:', isMemberFunctionError);
      return false;
    }

    console.log('All peer forum tables and functions created successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring peer forum tables exist:', error);
    return false;
  }
};

/**
 * Creates a default server and channels if none exist
 */
export const createDefaultServerIfNeeded = async (): Promise<boolean> => {
  try {
    // Check if any servers exist
    const { data: servers, error: serversError } = await supabase
      .from('peer_forum.servers')
      .select('id')
      .limit(1);

    if (serversError) {
      console.error('Error checking for existing servers:', serversError);
      return false;
    }

    // If servers already exist, don't create default
    if (servers && servers.length > 0) {
      console.log('Servers already exist, skipping default creation');
      return true;
    }

    console.log('No servers found, creating default server and channels');

    // Create default server
    const { data: server, error: serverError } = await supabase
      .from('peer_forum.servers')
      .insert({
        name: 'Medical Students Hub',
        description: 'Welcome to the Medical Students Hub!',
        icon: '🏥',
        is_default: true
      })
      .select()
      .single();

    if (serverError) {
      console.error('Error creating default server:', serverError);
      return false;
    }

    // Create default channels
    const defaultChannels = [
      { name: 'welcome', description: 'Welcome to the channel! Get started with introductions.', type: 'text', category: 'INFORMATION', position: 0 },
      { name: 'announcements', description: 'Important updates and announcements.', type: 'text', category: 'INFORMATION', position: 1 },
      { name: 'general', description: 'General discussion for all medical students.', type: 'text', category: 'TEXT CHANNELS', position: 0 },
      { name: 'study-tips', description: 'Share and discover effective study techniques.', type: 'text', category: 'TEXT CHANNELS', position: 1 },
      { name: 'resources', description: 'Share helpful books, websites, and materials.', type: 'text', category: 'TEXT CHANNELS', position: 2 },
      { name: 'case-discussions', description: 'Discuss interesting medical cases.', type: 'text', category: 'TEXT CHANNELS', position: 3 }
    ];

    for (const channel of defaultChannels) {
      const { error: channelError } = await supabase
        .from('peer_forum.channels')
        .insert({
          name: channel.name,
          description: channel.description,
          type: channel.type,
          category: channel.category,
          position: channel.position,
          server_id: server.id,
          is_private: false
        });

      if (channelError) {
        console.error(`Error creating channel ${channel.name}:`, channelError);
      }
    }

    console.log('Default server and channels created successfully');
    return true;
  } catch (error) {
    console.error('Error creating default server:', error);
    return false;
  }
};

/**
 * Initialize the peer forum by checking if tables exist
 */
export const initializePeerForum = async (): Promise<void> => {
  try {
    console.log('Initializing peer forum...');

    // Check if the peer forum tables exist
    const tablesExist = await checkPeerForumTables();

    if (!tablesExist) {
      console.log('Peer forum tables do not exist. Please run the SQL scripts in the Supabase SQL Editor.');
      toast.error('Peer forum tables not found. Please run the SQL scripts in the Supabase SQL Editor.');
      return;
    }

    console.log('Peer forum initialized successfully!');
    toast.success('Peer forum initialized successfully!');
  } catch (error) {
    console.error('Error initializing peer forum:', error);
    toast.error('Failed to initialize peer forum. Please run the SQL scripts in the Supabase SQL Editor.');
  }
};
