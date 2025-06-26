import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { checkPeerForumTables } from './createPeerForumTables_updated';

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

export { initializePeerForum };
