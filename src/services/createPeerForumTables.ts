import { supabase } from '../lib/supabaseClient';

/**
 * Checks if the peer forum tables exist
 * This is a more direct approach that doesn't rely on the execute_sql function
 */
export const checkPeerForumTables = async (): Promise<boolean> => {
  try {
    console.log('Checking if peer forum tables exist...');

    // Check if the peer_forum schema exists
    const { data: schemas, error: schemaError } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .eq('schema_name', 'peer_forum');

    if (schemaError) {
      console.error('Error checking for peer_forum schema:', schemaError);
      return false;
    }

    // If the schema doesn't exist, tables don't exist
    if (!schemas || schemas.length === 0) {
      console.log('Peer forum schema does not exist');
      return false;
    }

    console.log('Peer forum schema exists, checking for servers table');

    // Check if the servers table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'peer_forum')
      .eq('table_name', 'servers');

    if (tableError) {
      console.error('Error checking for servers table:', tableError);
      return false;
    }

    // If the servers table doesn't exist, consider tables not set up
    if (!tables || tables.length === 0) {
      console.log('Peer forum servers table does not exist');
      return false;
    }

    console.log('Peer forum tables exist');
    return true;
  } catch (error) {
    console.error('Error checking peer forum tables:', error);
    return false;
  }
};

/**
 * Checks if the peer forum tables exist and notifies the user if they don't
 */
export const createPeerForumTablesDirectly = async (): Promise<boolean> => {
  try {
    console.log('Checking peer forum tables...');

    const tablesExist = await checkPeerForumTables();

    if (tablesExist) {
      console.log('Peer forum tables already exist');
      return true;
    }

    console.log('Peer forum tables do not exist. Please run the SQL scripts in the Supabase SQL Editor.');

    // Create a notification for the user
    if (typeof window !== 'undefined') {
      // Check if we have access to the DOM
      const notification = document.createElement('div');
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.backgroundColor = '#f44336';
      notification.style.color = 'white';
      notification.style.padding = '15px';
      notification.style.borderRadius = '5px';
      notification.style.zIndex = '1000';
      notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      notification.innerHTML = `
        <h3 style="margin: 0 0 10px 0">Peer Forum Setup Required</h3>
        <p style="margin: 0">Please run the SQL scripts in the Supabase SQL Editor to set up the peer forum tables.</p>
        <button style="margin-top: 10px; padding: 5px 10px; background: white; color: #f44336; border: none; border-radius: 3px; cursor: pointer">Dismiss</button>
      `;

      document.body.appendChild(notification);

      // Add event listener to dismiss button
      const dismissButton = notification.querySelector('button');
      if (dismissButton) {
        dismissButton.addEventListener('click', () => {
          document.body.removeChild(notification);
        });
      }

      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 10000);
    }

    return false;
  } catch (error) {
    console.error('Error in createPeerForumTablesDirectly:', error);
    return false;
  }
};

export default createPeerForumTablesDirectly;
