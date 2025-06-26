# Supabase Setup Guide for Peer Forum

This guide will help you set up the Supabase backend for the peer forum feature in your application.

## Step 1: Run the Setup Scripts

First, you need to run the SQL scripts to set up the peer forum tables and RLS policies:

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Navigate to your project
3. Go to the SQL Editor
4. Run the `peer_forum_setup.sql` script first
   - This script creates the schema, tables, and functions needed for the peer forum
   - It also creates default servers and channels
5. Then run the `peer_forum_rls_fixed.sql` script
   - This script sets up Row Level Security (RLS) policies for the peer forum tables
   - It checks if policies exist before creating them to avoid errors

## Step 2: Create a Storage Bucket

The peer forum needs a storage bucket for file uploads:

1. In the Supabase dashboard, go to Storage
2. Create a new bucket named `peer_forum_files`
3. Set the bucket to public (or configure RLS policies as needed)
4. Set up the following RLS policies for the bucket:
   - Allow authenticated users to upload files
   - Allow anyone to view files
   - Allow file owners to delete their files

## Step 3: Check Environment Variables

Make sure your environment variables are correctly set in your `.env` file:

```
VITE_SUPABASE_URL=https://gzeeaqiimsmpiocvnzuj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 4: Fix the Supabase Client

If you're still experiencing issues, you might need to modify the Supabase client configuration:

1. Open `src/lib/supabaseClient.ts`
2. Make sure the URL and key are being correctly loaded from environment variables
3. Add better error handling to the client configuration

Here's an example of a robust Supabase client configuration:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Ensure the URL ends with no trailing slash
const cleanSupabaseUrl = supabaseUrl.replace(/\/$/, '');

export const supabase = createClient(cleanSupabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'CareAI'
    },
    fetch: (url, options) => {
      // Add custom fetch logic for better error handling
      return fetch(url, {
        ...options,
        // Add a timeout to prevent hanging requests
        signal: options.signal || AbortSignal.timeout(30000) // 30 second timeout
      }).then(async (response) => {
        // Log failed requests for debugging
        if (!response.ok) {
          console.warn(`Supabase request failed: ${response.status} ${response.statusText}`, {
            url,
            method: options.method,
            headers: options.headers
          });

          // Try to get more details from the response
          try {
            const errorData = await response.clone().json();
            console.error('Error details:', errorData);
          } catch (e) {
            // Ignore JSON parsing errors
          }
        }
        return response;
      }).catch(error => {
        console.error(`Network error in Supabase request to ${url}:`, error);
        throw error;
      });
    }
  }
});
```

## Step 5: Fix the Peer Forum Service

The peer forum service needs to be updated to handle errors gracefully:

1. Open `src/services/peerForumService.ts`
2. Update the functions to include proper error handling
3. Make sure the functions are using the correct table and schema names

Here are some key functions that need to be fixed:

### isChannelMember Function

```typescript
export const isChannelMember = async (channelId: string, userId: string): Promise<boolean> => {
  try {
    console.log(`Checking if user ${userId} is a member of channel ${channelId}`);
    
    // Try using the RPC function first
    const { data, error } = await supabase
      .rpc('peer_forum.is_channel_member', {
        p_channel_id: channelId,
        p_user_id: userId
      });

    if (error) {
      console.error('Error calling is_channel_member RPC:', error);
      console.log('Falling back to direct query...');

      // Fall back to direct query
      const { data: memberData, error: memberError } = await supabase
        .from('peer_forum.channel_members')
        .select('id')
        .eq('channel_id', channelId)
        .eq('user_id', userId);

      if (memberError) {
        console.error('Error checking channel membership via direct query:', memberError);
        return false;
      }

      return memberData && memberData.length > 0;
    }

    return !!data;
  } catch (error) {
    console.error('Unexpected error in isChannelMember:', error);
    return false;
  }
};
```

### joinChannel Function

```typescript
export const joinChannel = async (channelId: string, userId: string): Promise<boolean> => {
  try {
    console.log(`Attempting to join channel: ${channelId} for user: ${userId}`);

    // Try using the RPC function first
    const { data, error } = await supabase
      .rpc('peer_forum.join_channel', {
        p_channel_id: channelId,
        p_user_id: userId
      });

    if (error) {
      console.error('Error calling join_channel RPC:', error);
      
      // Fall back to direct insert
      try {
        // Get the server_id for this channel
        const { data: channelData, error: channelError } = await supabase
          .from('peer_forum.channels')
          .select('server_id')
          .eq('id', channelId)
          .single();

        if (channelError) {
          console.error('Error getting server_id for channel:', channelError);
          return false;
        }

        const serverId = channelData.server_id;

        // Add user to server_members
        const { error: serverMemberError } = await supabase
          .from('peer_forum.server_members')
          .insert([{
            server_id: serverId,
            user_id: userId,
            role: 'member'
          }])
          .on_conflict(['server_id', 'user_id'])
          .ignore();

        if (serverMemberError) {
          console.error('Error adding user to server_members:', serverMemberError);
        }

        // Add user to channel_members
        const { error: channelMemberError } = await supabase
          .from('peer_forum.channel_members')
          .insert([{
            channel_id: channelId,
            user_id: userId
          }])
          .on_conflict(['channel_id', 'user_id'])
          .ignore();

        if (channelMemberError) {
          console.error('Error adding user to channel_members:', channelMemberError);
          return false;
        }

        return true;
      } catch (fallbackError) {
        console.error('Error in fallback join channel approach:', fallbackError);
        return false;
      }
    }

    return !!data;
  } catch (error) {
    console.error('Unexpected error in joinChannel:', error);
    return false;
  }
};
```

## Step 6: Test the Changes

After making all these changes, restart your application and test the peer forum functionality:

1. Navigate to the peer forum page
2. Check if the servers and channels are displayed
3. Try joining a channel
4. Try sending a message
5. Check the console for any remaining errors

## Troubleshooting

If you're still experiencing issues, here are some troubleshooting steps:

### 404 Errors

If you're seeing 404 errors when trying to access Supabase endpoints:

1. Check that your Supabase URL is correct
2. Make sure the tables and functions exist in your Supabase project
3. Check that you have the correct permissions to access these resources

### 406 Errors

If you're seeing 406 errors:

1. Check that your queries are correctly formatted
2. Make sure you're not trying to select columns that don't exist
3. Check that you're using the correct content type in your requests

### RPC Function Errors

If you're having issues with RPC functions:

1. Check that the functions exist in your Supabase project
2. Make sure you have the correct permissions to execute these functions
3. Check that you're passing the correct parameters to the functions

### Connection Issues

If you're having general connection issues:

1. Check your internet connection
2. Make sure your Supabase project is up and running
3. Check that your API keys are correct and have not expired
