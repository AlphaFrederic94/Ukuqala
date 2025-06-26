import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Helper function to access tables in the peer_forum schema
export const fromPeerForum = (table: string) => {
  return supabase.from(table).headers({ 'x-schema': 'peer_forum' });
};

export interface Server {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  banner_url?: string;
  is_default: boolean;
  created_at: Date;
}

export interface Channel {
  id: string;
  server_id: string;
  name: string;
  description?: string;
  type: 'text' | 'voice' | 'video';
  category?: string;
  position: number;
  is_private: boolean;
  created_at: Date;
}

export interface Message {
  id: string;
  channel_id: string;
  content: string;
  is_pinned: boolean;
  is_edited: boolean;
  parent_id?: string;
  created_at: Date;
  updated_at: Date;
  user_id: string;
  username?: string;
  avatar_url?: string;
  attachments?: Attachment[];
  reactions?: Reaction[];
}

export interface Attachment {
  id: string;
  message_id: string;
  type: string;
  url?: string;
  name?: string;
  size?: number;
  duration?: number;
  created_at: Date;
  user_id: string;
}

export interface Reaction {
  id: string;
  message_id: string;
  emoji: string;
  count: number;
  user_ids: string[];
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
    const { data, error } = await fromPeerForum('servers')
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

export const getServer = async (id: string): Promise<Server | null> => {
  try {
    const { data, error } = await fromPeerForum('servers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching server ${id}:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Unexpected error in getServer:`, error);
    return null;
  }
};

export const createServer = async (server: Partial<Server>): Promise<Server | null> => {
  try {
    const { data, error } = await fromPeerForum('servers')
      .insert([server])
      .select()
      .single();

    if (error) {
      console.error('Error creating server:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in createServer:', error);
    return null;
  }
};

// Channels
export const getChannels = async (serverId: string): Promise<Channel[]> => {
  try {
    const { data, error } = await fromPeerForum('channels')
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

export const getChannel = async (id: string): Promise<Channel | null> => {
  try {
    const { data, error } = await fromPeerForum('channels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching channel ${id}:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`Unexpected error in getChannel:`, error);
    return null;
  }
};

export const createChannel = async (channel: Partial<Channel>): Promise<Channel | null> => {
  try {
    const { data, error } = await fromPeerForum('channels')
      .insert([channel])
      .select()
      .single();

    if (error) {
      console.error('Error creating channel:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in createChannel:', error);
    return null;
  }
};

// Messages
export const getMessages = async (channelId: string, limit = 50, beforeTimestamp?: Date): Promise<Message[]> => {
  try {
    // Since we can't use RPC with x-schema header, we'll use a direct query
    const query = fromPeerForum('messages')
      .select(`
        id,
        channel_id,
        content,
        is_pinned,
        is_edited,
        parent_id,
        created_at,
        updated_at,
        user_id
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (beforeTimestamp) {
      query.lt('created_at', beforeTimestamp.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching messages for channel ${channelId}:`, error);
      return [];
    }

    // Format the messages
    const messages = data.map(msg => ({
      id: msg.id,
      channel_id: msg.channel_id,
      content: msg.content,
      is_pinned: msg.is_pinned,
      is_edited: msg.is_edited,
      parent_id: msg.parent_id,
      created_at: new Date(msg.created_at),
      updated_at: new Date(msg.updated_at),
      user_id: msg.user_id
    }));

    // Get user information for each message
    const userIds = [...new Set(messages.map(msg => msg.user_id))];

    // Fetch user profiles from auth.users table
    // Note: This might need adjustment based on your auth setup
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', userIds);

    if (!userError && users) {
      // Add user information to messages
      messages.forEach(msg => {
        const user = users.find(u => u.id === msg.user_id);
        if (user) {
          msg.username = user.username;
          msg.avatar_url = user.avatar_url;
        } else {
          msg.username = 'Unknown User';
        }
      });
    }

    // Fetch attachments for messages
    const messageIds = messages.map(message => message.id);
    const { data: attachmentsData, error: attachmentsError } = await fromPeerForum('attachments')
      .select('*')
      .in('message_id', messageIds);

    if (!attachmentsError && attachmentsData) {
      // Add attachments to messages
      messages.forEach(msg => {
        msg.attachments = attachmentsData
          .filter(att => att.message_id === msg.id)
          .map(att => ({
            id: att.id,
            message_id: att.message_id,
            type: att.type,
            url: att.url,
            name: att.name,
            size: att.size,
            duration: att.duration,
            created_at: new Date(att.created_at),
            user_id: att.user_id
          }));
      });
    }

    return messages;
  } catch (error) {
    console.error(`Unexpected error in getMessages:`, error);
    return [];
  }
};

export const createMessage = async (message: Partial<Message>): Promise<Message | null> => {
  try {
    console.log(`Creating message in channel ${message.channel_id} by user ${message.user_id}`);

    // Validate input
    if (!message.channel_id || !message.user_id || !message.content) {
      console.error('Invalid message data:', message);
      throw new Error('Missing required message fields: channel_id, user_id, or content');
    }

    // First check if the user is a member of the channel
    const isMember = await isChannelMember(message.channel_id, message.user_id);

    // If not a member, try to join the channel first
    if (!isMember) {
      const joined = await joinChannel(message.channel_id, message.user_id);
      if (!joined) {
        console.error('Failed to join channel before sending message');
        return null;
      }
    }

    // Insert the message
    const { data, error } = await fromPeerForum('messages')
      .insert([{
        channel_id: message.channel_id,
        content: message.content,
        is_pinned: message.is_pinned || false,
        is_edited: false,
        parent_id: message.parent_id,
        user_id: message.user_id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return null;
    }

    // If there are attachments, create them
    if (message.attachments && message.attachments.length > 0) {
      try {
        const attachmentsToInsert = message.attachments.map(attachment => ({
          message_id: data.id,
          type: attachment.type,
          url: attachment.url,
          name: attachment.name,
          size: attachment.size,
          duration: attachment.duration,
          user_id: message.user_id
        }));

        const { error: attachmentError } = await fromPeerForum('attachments')
          .insert(attachmentsToInsert);

        if (attachmentError) {
          console.error('Error creating attachments:', attachmentError);
        } else {
          console.log(`Created ${attachmentsToInsert.length} attachments for message ${data.id}`);
        }
      } catch (attachmentError) {
        console.error('Error processing attachments:', attachmentError);
      }
    }

    return {
      id: data.id,
      channel_id: data.channel_id,
      content: data.content,
      is_pinned: data.is_pinned,
      is_edited: data.is_edited,
      parent_id: data.parent_id,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      user_id: data.user_id,
      username: 'You', // This will be replaced by the UI
      attachments: message.attachments
    } as Message;
  } catch (error) {
    console.error('Unexpected error in createMessage:', error);
    return null;
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
      return null;
    }

    const { data } = supabase.storage
      .from('peer_forum_files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Unexpected error in uploadFile:', error);
    return null;
  }
};

// Channel membership
export const isChannelMember = async (channelId: string, userId: string): Promise<boolean> => {
  try {
    console.log(`Checking if user ${userId} is a member of channel ${channelId}`);

    const { data, error } = await fromPeerForum('channel_members')
      .select('id')
      .eq('channel_id', channelId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error checking channel membership:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Unexpected error in isChannelMember:', error);
    return false;
  }
};

export const joinChannel = async (channelId: string, userId: string): Promise<boolean> => {
  try {
    console.log(`Attempting to join channel: ${channelId} for user: ${userId}`);

    // Get the server_id for this channel
    const { data: channelData, error: channelError } = await fromPeerForum('channels')
      .select('server_id')
      .eq('id', channelId)
      .single();

    if (channelError) {
      console.error('Error getting server_id for channel:', channelError);
      return false;
    }

    const serverId = channelData.server_id;

    // Add user to server_members
    const { error: serverMemberError } = await fromPeerForum('server_members')
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
    const { error: channelMemberError } = await fromPeerForum('channel_members')
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
  } catch (error) {
    console.error('Unexpected error in joinChannel:', error);
    return false;
  }
};

// Subscriptions
export const subscribeToMessages = (channelId: string, callback: (message: Message) => void) => {
  return supabase
    .channel(`messages:${channelId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'peer_forum',
      table: 'messages',
      filter: `channel_id=eq.${channelId}`
    }, (payload) => {
      callback(payload.new as Message);
    })
    .subscribe();
};

export const getChannelMembers = async (channelId: string): Promise<any[]> => {
  try {
    // Direct query instead of RPC
    const { data, error } = await fromPeerForum('channel_members')
      .select(`
        user_id,
        joined_at,
        last_read_at
      `)
      .eq('channel_id', channelId);

    if (error) {
      console.error('Error getting channel members:', error);
      return [];
    }

    // Get user profiles
    const userIds = data.map(member => member.user_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', userIds);

    if (usersError) {
      console.error('Error getting user profiles:', usersError);
      return data;
    }

    // Combine the data
    return data.map(member => {
      const user = users?.find(u => u.id === member.user_id);
      return {
        user_id: member.user_id,
        username: user?.username || 'Unknown User',
        avatar_url: user?.avatar_url || null,
        joined_at: member.joined_at,
        last_read_at: member.last_read_at
      };
    });
  } catch (error) {
    console.error('Error in getChannelMembers:', error);
    return [];
  }
};
