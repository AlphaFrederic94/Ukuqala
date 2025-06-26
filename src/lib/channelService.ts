import { supabase } from './supabaseClient';

export interface ChatGroup {
  id: string;
  name: string;
  description: string;
  type: 'fitness' | 'food' | 'anatomy';
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface ChatGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface ChatGroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  is_sticker: boolean;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

// Initialize chat groups if they don't exist
const ensureChannelsExist = async () => {
  try {
    // Check if chat groups already exist
    const { data: existingGroups, error: checkError } = await supabase
      .from('chat_groups')
      .select('id')
      .limit(1);

    if (checkError) throw checkError;

    // If groups already exist, don't create new ones
    if (existingGroups && existingGroups.length > 0) {
      return;
    }

    // Get the first user to be the creator
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (adminError) throw adminError;

    const adminId = adminUser?.id;
    if (!adminId) {
      throw new Error('No user found to create channels');
    }

    // Create the chat groups
    const groups = [
      {
        name: 'Fitness Enthusiasts',
        description: 'A group for discussing fitness routines, workout tips, and staying motivated.',
        type: 'fitness',
        created_by: adminId
      },
      {
        name: 'Healthy Eating',
        description: 'Share recipes, nutrition tips, and discuss balanced diets for better health.',
        type: 'food',
        created_by: adminId
      },
      {
        name: 'Medical Discussions',
        description: 'A place to discuss medical topics, anatomy, and health conditions with others.',
        type: 'anatomy',
        created_by: adminId
      }
    ];

    const { data, error } = await supabase
      .from('chat_groups')
      .insert(groups)
      .select();

    if (error) throw error;

    // Add the admin user as a member of all groups
    if (data) {
      const memberships = data.map(group => ({
        group_id: group.id,
        user_id: adminId
      }));

      await supabase
        .from('chat_group_members')
        .insert(memberships);

      // Add welcome messages to each group
      const welcomeMessages = data.map(group => ({
        group_id: group.id,
        user_id: adminId,
        content: `Welcome to the ${group.name} channel! Feel free to share and discuss topics related to ${group.type}.`,
        is_sticker: false
      }));

      await supabase
        .from('chat_group_messages')
        .insert(welcomeMessages);
    }
  } catch (error) {
    console.error('Error ensuring channels exist:', error);
  }
};

export const channelService = {
  async getChannels() {
    try {
      // Ensure channels exist before fetching
      await ensureChannelsExist();

      const { data, error } = await supabase
        .from('chat_groups')
        .select(`
          *,
          members:chat_group_members(count)
        `)
        .order('type', { ascending: true });

      if (error) throw error;

      // Process the data to get member count
      const processedData = data.map(group => ({
        ...group,
        member_count: group.members?.length || 0
      }));

      return processedData;
    } catch (error) {
      console.error('Error fetching channels:', error);
      return [];
    }
  },

  async getChannelById(channelId: string) {
    try {
      const { data, error } = await supabase
        .from('chat_groups')
        .select(`
          *,
          members:chat_group_members(count)
        `)
        .eq('id', channelId)
        .single();

      if (error) throw error;

      return {
        ...data,
        member_count: data.members?.length || 0
      };
    } catch (error) {
      console.error('Error fetching channel:', error);
      return null;
    }
  },

  async joinChannel(channelId: string, userId: string) {
    try {
      // Check if already a member
      const { data: existingMember, error: checkError } = await supabase
        .from('chat_group_members')
        .select('id')
        .eq('group_id', channelId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingMember) {
        return { data: existingMember, isNewMember: false };
      }

      // Join the channel
      const { data, error } = await supabase
        .from('chat_group_members')
        .insert([
          {
            group_id: channelId,
            user_id: userId
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Get channel info for notification
      const { data: channelData } = await supabase
        .from('chat_groups')
        .select('name')
        .eq('id', channelId)
        .single();

      // Create a notification for the user
      if (channelData) {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'channel_joined',
            title: 'Channel Joined',
            message: `You've successfully joined the ${channelData.name} channel!`,
            link: `/social/channel/${channelId}`,
            read: false
          });
      }

      // Send welcome message
      await this.sendWelcomeMessage(channelId, userId);

      return { data, isNewMember: true };
    } catch (error) {
      console.error('Error joining channel:', error);
      throw error;
    }
  },

  async leaveChannel(channelId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('chat_group_members')
        .delete()
        .eq('group_id', channelId)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error leaving channel:', error);
      throw error;
    }
  },

  async getChannelMembers(channelId: string) {
    try {
      const { data, error } = await supabase
        .from('chat_group_members')
        .select(`
          *,
          user:profiles!chat_group_members_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('group_id', channelId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching channel members:', error);
      return [];
    }
  },

  async getChannelMessages(channelId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('chat_group_messages')
        .select(`
          *,
          user:profiles!chat_group_messages_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('group_id', channelId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error fetching channel messages:', error);
      return [];
    }
  },

  async sendMessage(channelId: string, userId: string, content: string, isSticker = false) {
    try {
      console.log('Sending message using RPC function');
      // Try to use the stored procedure first
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'send_chat_group_message',
        {
          p_group_id: channelId,
          p_user_id: userId,
          p_content: content,
          p_is_sticker: isSticker
        }
      );

      if (rpcError) {
        console.warn('RPC function failed, falling back to direct insert:', rpcError);
        // Fall back to direct insert if the stored procedure doesn't exist
        const { data, error } = await supabase
          .from('chat_group_messages')
          .insert([
            {
              group_id: channelId,
              user_id: userId,
              content,
              is_sticker: isSticker
            }
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // If RPC was successful, fetch the message data
      const { data, error } = await supabase
        .from('chat_group_messages')
        .select()
        .eq('id', rpcData)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  async sendWelcomeMessage(channelId: string, userId: string) {
    try {
      // Get channel info
      const { data: channel, error: channelError } = await supabase
        .from('chat_groups')
        .select('name, type')
        .eq('id', channelId)
        .single();

      if (channelError) throw channelError;

      // Get user info
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Send welcome message from system
      const { data: adminUser } = await supabase
        .from('profiles')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      const adminId = adminUser?.id || userId;

      // Welcome message
      const welcomeMessage = `Welcome ${user.full_name} to the ${channel.name} channel! Feel free to share and discuss topics related to ${channel.type}.`;

      await this.sendMessage(channelId, adminId, welcomeMessage);

      // Send a sticker
      const stickers = [
        "👋 Welcome!",
        "🎉 Great to have you here!",
        "💪 Let's get healthy together!",
        "🥗 Healthy eating starts now!",
        "❤️ Health is wealth!"
      ];

      const randomSticker = stickers[Math.floor(Math.random() * stickers.length)];
      await this.sendMessage(channelId, adminId, randomSticker, true);

      return true;
    } catch (error) {
      console.error('Error sending welcome message:', error);
      return false;
    }
  }
};
