import { supabase } from './lib/supabaseClient';
import { fromPeerForum, getServers, getChannels, isChannelMember, joinChannel, ensureChannelMembership } from './services/peerForumService';

/**
 * Test function to verify that the peer forum service is working correctly
 */
export const testPeerForum = async () => {
  console.log('Testing peer forum service...');

  try {
    // Test the fromPeerForum helper function
    console.log('Testing fromPeerForum helper...');
    const { data: serversData, error: serversError } = await fromPeerForum('servers')
      .select('*')
      .limit(1);

    if (serversError) {
      console.error('Error using fromPeerForum helper:', serversError);

      // Try direct access as a fallback
      console.log('Trying direct access to peer_forum.servers...');
      const { data: directData, error: directError } = await supabase
        .from('peer_forum.servers')
        .select('*')
        .limit(1);

      if (directError) {
        console.error('Error with direct access:', directError);
      } else {
        console.log('Direct access works! Found servers:', directData);
      }
    } else {
      console.log('fromPeerForum helper works! Found servers:', serversData);
    }

    // Test the getServers function
    console.log('Testing getServers function...');
    const servers = await getServers();
    console.log('getServers result:', servers);

    if (servers.length > 0) {
      const serverId = servers[0].id;

      // Test the getChannels function
      console.log(`Testing getChannels function for server ${serverId}...`);
      const channels = await getChannels(serverId);
      console.log('getChannels result:', channels);

      if (channels.length === 0) {
        console.log('No channels found for server. This may indicate a problem with channel creation.');
        console.log('Please run the fix-peer-forum.js script to create default channels.');

        // Try direct access to channels table
        console.log('Trying direct access to peer_forum.channels...');
        const { data: directChannels, error: directError } = await supabase
          .from('peer_forum.channels')
          .select('*')
          .eq('server_id', serverId);

        if (directError) {
          console.error('Error with direct access to channels:', directError);
        } else {
          console.log('Direct access to channels result:', directChannels);
        }
      }

      if (channels.length > 0) {
        const channelId = channels[0].id;

        // Get the current user's ID
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || 'test-user-id';
        console.log(`Using user ID: ${userId}`);

        // Test the isChannelMember function
        console.log(`Testing isChannelMember function for channel ${channelId} and user ${userId}...`);
        const isMember = await isChannelMember(channelId, userId);
        console.log('isChannelMember result:', isMember);

        // Test the ensureChannelMembership function
        console.log(`Testing ensureChannelMembership function for channel ${channelId} and user ${userId}...`);
        const ensured = await ensureChannelMembership(channelId, userId);
        console.log('ensureChannelMembership result:', ensured);

        // Verify membership after ensuring
        console.log(`Verifying membership after ensuring...`);
        const isMemberAfterEnsuring = await isChannelMember(channelId, userId);
        console.log('isChannelMember result after ensuring:', isMemberAfterEnsuring);

        // Test the joinChannel function
        console.log(`Testing joinChannel function for channel ${channelId} and user ${userId}...`);
        const joined = await joinChannel(channelId, userId);
        console.log('joinChannel result:', joined);

        // Verify membership after joining
        console.log(`Verifying membership after joining...`);
        const isMemberAfterJoining = await isChannelMember(channelId, userId);
        console.log('isChannelMember result after joining:', isMemberAfterJoining);
      }
    }

    // Test direct access to views in public schema
    console.log('Testing direct access to views in public schema...');
    const { data: viewData, error: viewError } = await supabase
      .from('peer_forum_servers')
      .select('*')
      .limit(1);

    if (viewError) {
      console.error('Error accessing view in public schema:', viewError);
    } else {
      console.log('Direct access to view works! Found servers:', viewData);
    }

    console.log('Peer forum service tests completed!');
  } catch (error) {
    console.error('Error testing peer forum service:', error);
  }
};

// Uncomment the line below to run the test when this file is imported
// testPeerForum();
