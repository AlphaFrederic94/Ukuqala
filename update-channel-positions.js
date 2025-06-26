// Script to update channel positions
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

// Channel positions by category
const channelPositions = {
  'INFORMATION': {
    'welcome': 0,
    'announcements': 1
  },
  'TEXT CHANNELS': {
    'general': 0,
    'study-tips': 1,
    'resources': 2,
    'case-discussions': 3
  }
};

async function updateChannelPositions() {
  console.log('Updating channel positions...');
  
  try {
    // Get all channels
    const { data: channels, error: channelsError } = await supabase
      .from('peer_forum.channels')
      .select('*');

    if (channelsError) {
      console.error('Error fetching channels:', channelsError);
      return;
    }

    console.log(`Found ${channels.length} channels to update`);

    // Update each channel with the correct position
    for (const channel of channels) {
      const category = channel.category || '';
      const name = channel.name || '';
      
      // Skip if we don't have a position defined for this channel
      if (!channelPositions[category] || channelPositions[category][name] === undefined) {
        console.log(`Skipping channel ${name} in category ${category} - no position defined`);
        continue;
      }
      
      const position = channelPositions[category][name];
      console.log(`Updating channel ${name} in category ${category} to position ${position}`);
      
      const { error: updateError } = await supabase
        .from('peer_forum.channels')
        .update({ position })
        .eq('id', channel.id);
        
      if (updateError) {
        console.error(`Error updating channel ${name}:`, updateError);
      } else {
        console.log(`Successfully updated channel ${name}`);
      }
    }

    console.log('Channel position updates completed!');
  } catch (error) {
    console.error('Error updating channel positions:', error);
  }
}

updateChannelPositions();
