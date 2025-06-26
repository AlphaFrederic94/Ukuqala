# Fixing Peer Forum Service Issues

Based on the error logs, there are several issues with the peer forum service. Here's how to fix them:

## 1. Fix the peerForumService.ts File

The `peerForumService.ts` file is trying to use functions that don't exist or are failing. Here's a fixed version:

```typescript
// src/services/peerForumService.ts

import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';

// Types
export interface Server {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'text' | 'voice';
  server_id: string;
  category?: string;
  is_private: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  position?: number;
}

export interface Message {
  id: string;
  channelId: string;
  content: string;
  isPinned?: boolean;
  isEdited?: boolean;
  parentId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  username?: string;
  avatarUrl?: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  messageId: string;
  type: string;
  url?: string;
  name?: string;
  size?: number;
  duration?: number;
  createdAt: Date;
  userId: string;
}

export interface ChannelMember {
  id: string;
  channelId: string;
  userId: string;
  joinedAt: Date;
  lastReadAt: Date;
}

export interface ServerMember {
  id: string;
  serverId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: Date;
  server_count: number;
  message_count: number;
}

// Servers
export const getServers = async (): Promise<Server[]> => {
  try {
    const { data, error } = await supabase
      .from('peer_forum.servers')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching servers:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getServers:', error);
    return [];
  }
};

// Channels
export const getChannels = async (serverId: string): Promise<Channel[]> => {
  try {
    const { data, error } = await supabase
      .from('peer_forum.channels')
      .select('*')
      .eq('server_id', serverId)
      .order('category')
      .order('position');

    if (error) {
      console.error(`Error fetching channels for server ${serverId}:`, error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getChannels:', error);
    return [];
  }
};

// Messages
export const getMessages = async (channelId: string, limit = 50): Promise<Message[]> => {
  try {
    // Get messages directly from the messages table
    const { data, error } = await supabase
      .from('peer_forum.messages')
      .select(`
        id,
        channel_id,
        content,
        is_pinned,
        is_edited,
        parent_id,
        user_id,
        created_at,
        updated_at
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`Error fetching messages for channel ${channelId}:`, error);
      return [];
    }

    // Format the messages
    const messages: Message[] = (data || []).map(msg => ({
      id: msg.id,
      channelId: msg.channel_id,
      content: msg.content,
      isPinned: msg.is_pinned,
      isEdited: msg.is_edited,
      parentId: msg.parent_id,
      userId: msg.user_id,
      createdAt: new Date(msg.created_at),
      updatedAt: new Date(msg.updated_at)
    }));

    // Get user information for each message
    const userIds = [...new Set(messages.map(msg => msg.userId))];
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id, raw_user_meta_data')
      .in('id', userIds);

    if (userError) {
      console.error('Error fetching user information:', userError);
    } else if (users) {
      // Add user information to messages
      messages.forEach(msg => {
        const user = users.find(u => u.id === msg.userId);
        if (user && user.raw_user_meta_data) {
          msg.username = user.raw_user_meta_data.full_name || 'Unknown User';
          msg.avatarUrl = user.raw_user_meta_data.avatar_url || '';
        } else {
          msg.username = 'Unknown User';
          msg.avatarUrl = '';
        }
      });
    }

    return messages;
  } catch (error) {
    console.error('Unexpected error in getMessages:', error);
    return [];
  }
};

// Create a message
export const createMessage = async (message: Partial<Message>): Promise<Message | null> => {
  try {
    // Check if the user is a member of the channel
    const isMember = await isChannelMember(message.channelId!, message.userId!);
    
    if (!isMember) {
      // Try to join the channel first
      const joined = await joinChannel(message.channelId!, message.userId!);
      if (!joined) {
        console.error('Failed to join channel before sending message');
        toast.error('Failed to join channel. Please try again.');
        return null;
      }
    }

    // Insert the message
    const { data, error } = await supabase
      .from('peer_forum.messages')
      .insert([{
        channel_id: message.channelId,
        content: message.content,
        is_pinned: message.isPinned || false,
        is_edited: false,
        parent_id: message.parentId,
        user_id: message.userId
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      toast.error('Failed to send message. Please try again.');
      return null;
    }

    // Format the message
    const newMessage: Message = {
      id: data.id,
      channelId: data.channel_id,
      content: data.content,
      isPinned: data.is_pinned,
      isEdited: data.is_edited,
      parentId: data.parent_id,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    return newMessage;
  } catch (error) {
    console.error('Unexpected error in createMessage:', error);
    toast.error('Failed to send message. Please try again.');
    return null;
  }
};

// Check if a user is a member of a channel
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

// Join a channel
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

// File uploads
export const uploadFile = async (file: File, userId: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from('peer_forum_files')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file. Please try again.');
      return null;
    }

    const { data } = supabase.storage
      .from('peer_forum_files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Unexpected error in uploadFile:', error);
    toast.error('Failed to upload file. Please try again.');
    return null;
  }
};
```

## 2. Fix the ChatArea.tsx Component

The `ChatArea.tsx` component is having issues with checking membership and joining channels. Here's a simplified version of the membership check and join logic:

```typescript
// In ChatArea.tsx

// Check if the user is a member of the channel
const checkMembership = async () => {
  try {
    setCheckingMembership(true);
    console.log(`Checking membership for channel ${channelId}, user ${userId}`);
    
    if (!channelId || !userId) {
      setIsMember(false);
      setCheckingMembership(false);
      return;
    }
    
    const result = await isChannelMember(channelId, userId);
    console.log('Membership check result:', result);
    setIsMember(result);
    
    if (!result) {
      // If not a member, try to join automatically
      handleJoinChannel();
    }
  } catch (error) {
    console.error('Error checking membership:', error);
    setIsMember(false);
  } finally {
    setCheckingMembership(false);
  }
};

// Handle joining a channel
const handleJoinChannel = async () => {
  try {
    setJoining(true);
    console.log(`Attempting to join channel ${channelId} for user ${userId}`);
    
    if (!channelId || !userId) {
      toast.error('Cannot join channel: Missing channel ID or user ID');
      return;
    }
    
    const result = await joinChannel(channelId, userId);
    
    if (result) {
      console.log(`Successfully joined channel ${channelId}`);
      setIsMember(true);
      toast.success('Joined channel successfully');
    } else {
      console.error(`Failed to join channel ${channelId}`);
      toast.error('Failed to join channel. Please try again.');
    }
  } catch (error) {
    console.error('Error joining channel:', error);
    toast.error('Failed to join channel. Please try again.');
  } finally {
    setJoining(false);
  }
};
```

## 3. Fix the peerForumSetupService.ts File

The `peerForumSetupService.ts` file is trying to create tables using the `execute_sql` function, which is failing. Here's a simplified version:

```typescript
// src/services/peerForumSetupService.ts

import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

/**
 * Initialize the peer forum by checking if tables exist
 */
export const initializePeerForum = async (): Promise<void> => {
  try {
    console.log('Initializing peer forum...');
    
    // Check if the peer_forum schema exists
    const { data: schemas, error: schemaError } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .eq('schema_name', 'peer_forum');
    
    if (schemaError) {
      console.error('Error checking for peer_forum schema:', schemaError);
      toast.error('Failed to initialize peer forum. Please run the SQL scripts in the Supabase SQL Editor.');
      return;
    }
    
    // If the schema doesn't exist, prompt the user to run the SQL scripts
    if (!schemas || schemas.length === 0) {
      console.log('Peer forum schema not found. Please run the SQL scripts.');
      toast.error('Peer forum schema not found. Please run the SQL scripts in the Supabase SQL Editor.');
      return;
    }
    
    // Check if the servers table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'peer_forum')
      .eq('table_name', 'servers');
    
    if (tableError) {
      console.error('Error checking for servers table:', tableError);
      toast.error('Failed to initialize peer forum. Please run the SQL scripts in the Supabase SQL Editor.');
      return;
    }
    
    // If the tables don't exist, prompt the user to run the SQL scripts
    if (!tables || tables.length === 0) {
      console.log('Peer forum tables not found. Please run the SQL scripts.');
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
```

## 4. Test the Changes

After making these changes, restart your application and test the peer forum functionality. You should no longer see the errors in the console.
