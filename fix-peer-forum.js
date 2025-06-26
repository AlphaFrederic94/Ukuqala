// Script to fix peer forum issues
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

async function fixPeerForum() {
  console.log('Starting peer forum fixes...');
  
  try {
    // Step 1: Check if the peer_forum schema exists
    console.log('Checking if peer_forum schema exists...');
    const { data: schemas, error: schemaError } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .eq('schema_name', 'peer_forum');

    if (schemaError) {
      console.error('Error checking for peer_forum schema:', schemaError);
      return;
    }

    if (!schemas || schemas.length === 0) {
      console.log('Peer forum schema does not exist. Please run the SQL migrations first.');
      return;
    }

    console.log('Peer forum schema exists.');

    // Step 2: Check if the servers table exists and has the default server
    console.log('Checking for default server...');
    const { data: servers, error: serversError } = await supabase
      .from('peer_forum.servers')
      .select('*')
      .eq('is_default', true)
      .limit(1);

    if (serversError) {
      console.error('Error checking for default server:', serversError);
      return;
    }

    let serverId;
    if (!servers || servers.length === 0) {
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
      serverId = newServer.id;
    } else {
      console.log('Default server found:', servers[0]);
      serverId = servers[0].id;
    }

    // Step 3: Check if channels exist for the default server
    console.log(`Checking for channels for server ${serverId}...`);
    const { data: channels, error: channelsError } = await supabase
      .from('peer_forum.channels')
      .select('*')
      .eq('server_id', serverId);

    if (channelsError) {
      console.error('Error checking for channels:', channelsError);
      return;
    }

    if (!channels || channels.length === 0) {
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
    } else {
      console.log(`Found ${channels.length} existing channels for server ${serverId}`);
      
      // Update positions for existing channels
      console.log('Updating positions for existing channels...');
      for (const channel of channels) {
        // Find the matching default channel
        const defaultChannel = defaultChannels.find(dc => dc.name === channel.name && dc.category === channel.category);
        
        if (defaultChannel && (channel.position === null || channel.position === undefined)) {
          console.log(`Updating position for channel ${channel.name} to ${defaultChannel.position}`);
          
          const { error: updateError } = await supabase
            .from('peer_forum.channels')
            .update({ position: defaultChannel.position })
            .eq('id', channel.id);
            
          if (updateError) {
            console.error(`Error updating channel ${channel.name}:`, updateError);
          } else {
            console.log(`Updated position for channel ${channel.name}`);
          }
        }
      }
    }

    // Step 4: Verify channels were created/updated
    const { data: updatedChannels, error: updatedChannelsError } = await supabase
      .from('peer_forum.channels')
      .select('*')
      .eq('server_id', serverId)
      .order('category')
      .order('position');
      
    if (updatedChannelsError) {
      console.error('Error verifying channels:', updatedChannelsError);
    } else {
      console.log(`Verified ${updatedChannels.length} channels for server ${serverId}:`);
      updatedChannels.forEach(channel => {
        console.log(`- ${channel.category} / ${channel.name} (position: ${channel.position})`);
      });
    }

    console.log('Peer forum fixes completed!');
  } catch (error) {
    console.error('Error fixing peer forum:', error);
  }
}

fixPeerForum();
