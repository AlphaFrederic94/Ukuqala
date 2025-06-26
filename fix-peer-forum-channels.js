// Script to check and fix peer forum channels
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

// Default channels to create
const defaultChannels = [
  { name: 'welcome', description: 'Welcome to the channel! Get started with introductions.', type: 'text', category: 'INFORMATION', position: 0 },
  { name: 'announcements', description: 'Important updates and announcements.', type: 'text', category: 'INFORMATION', position: 1 },
  { name: 'general', description: 'General discussion for all medical students.', type: 'text', category: 'TEXT CHANNELS', position: 0 },
  { name: 'study-tips', description: 'Share and discover effective study techniques.', type: 'text', category: 'TEXT CHANNELS', position: 1 },
  { name: 'resources', description: 'Share helpful books, websites, and materials.', type: 'text', category: 'TEXT CHANNELS', position: 2 },
  { name: 'case-discussions', description: 'Discuss interesting medical cases.', type: 'text', category: 'TEXT CHANNELS', position: 3 }
];

async function fixPeerForumChannels() {
  console.log('Checking peer forum channels...');
  
  try {
    // Get the default server
    const { data: serversData, error: serversError } = await supabase
      .from('peer_forum.servers')
      .select('*')
      .eq('is_default', true)
      .limit(1);

    if (serversError) {
      console.error('Error accessing servers:', serversError);
      return;
    }

    if (!serversData || serversData.length === 0) {
      console.log('No default server found. Creating one...');
      
      // Create default server
      const { data: newServer, error: newServerError } = await supabase
        .from('peer_forum.servers')
        .insert({
          name: 'Medical Students Hub',
          description: 'Welcome to the Medical Students Hub!',
          icon: '🏥',
          is_default: true
        })
        .select()
        .single();
      
      if (newServerError) {
        console.error('Error creating default server:', newServerError);
        return;
      }
      
      console.log('Default server created:', newServer);
      serversData = [newServer];
    }

    const serverId = serversData[0].id;
    console.log(`Found default server with ID: ${serverId}`);

    // Check if channels exist for this server
    const { data: channelsData, error: channelsError } = await supabase
      .from('peer_forum.channels')
      .select('*')
      .eq('server_id', serverId);

    if (channelsError) {
      console.error('Error checking channels:', channelsError);
      return;
    }

    if (!channelsData || channelsData.length === 0) {
      console.log('No channels found for default server. Creating default channels...');
      
      // Create default channels
      for (const channel of defaultChannels) {
        const { error: channelError } = await supabase
          .from('peer_forum.channels')
          .insert({
            name: channel.name,
            description: channel.description,
            type: channel.type,
            category: channel.category,
            position: channel.position,
            server_id: serverId,
            is_private: false
          });

        if (channelError) {
          console.error(`Error creating channel ${channel.name}:`, channelError);
        } else {
          console.log(`Created channel: ${channel.name}`);
        }
      }
      
      // Verify channels were created
      const { data: newChannels, error: newChannelsError } = await supabase
        .from('peer_forum.channels')
        .select('*')
        .eq('server_id', serverId);
        
      if (newChannelsError) {
        console.error('Error verifying new channels:', newChannelsError);
      } else {
        console.log(`Created ${newChannels.length} channels for server ${serverId}`);
        console.log('Channels:', newChannels);
      }
    } else {
      console.log(`Found ${channelsData.length} existing channels for server ${serverId}`);
      console.log('Channels:', channelsData);
    }

    console.log('Peer forum channels check completed!');
  } catch (error) {
    console.error('Error fixing peer forum channels:', error);
  }
}

fixPeerForumChannels();
