// Simple script to test if channels exist in the database
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testChannels() {
  console.log('Testing peer forum service...');
  console.log('Testing fromPeerForum helper...');
  
  try {
    // Test direct access to servers
    const { data: serversData, error: serversError } = await supabase
      .from('peer_forum.servers')
      .select('*')
      .limit(10);

    if (serversError) {
      console.error('Error accessing servers:', serversError);
    } else {
      console.log('Direct access to view works! Found servers:', serversData);
    }

    // If servers exist, check for channels
    if (serversData && serversData.length > 0) {
      const serverId = serversData[0].id;
      console.log(`Testing channels for server ${serverId}...`);
      
      const { data: channelsData, error: channelsError } = await supabase
        .from('peer_forum.channels')
        .select('*')
        .eq('server_id', serverId)
        .order('category')
        .order('name');

      if (channelsError) {
        console.error('Error accessing channels:', channelsError);
      } else {
        console.log('Found channels:', channelsData);
      }
    }

    console.log('Peer forum service tests completed!');
  } catch (error) {
    console.error('Error testing peer forum service:', error);
  }
}

testChannels();
