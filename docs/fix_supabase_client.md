# Fixing Supabase Client Issues

Based on the error logs, there are several issues with the Supabase client configuration and database setup. Follow these steps to fix them:

## 1. Run the SQL Scripts in Supabase SQL Editor

First, you need to run the SQL scripts to set up the peer forum tables and RLS policies:

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Navigate to your project
3. Go to the SQL Editor
4. Run the `peer_forum_setup.sql` script first
5. Then run the `peer_forum_rls.sql` script

## 2. Check Supabase Environment Variables

Make sure your environment variables are correctly set in your `.env` file:

```
VITE_SUPABASE_URL=https://gzeeaqiimsmpiocvnzuj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. Create a Storage Bucket for File Uploads

The peer forum needs a storage bucket for file uploads:

1. In the Supabase dashboard, go to Storage
2. Create a new bucket named `peer_forum_files`
3. Set the bucket to public (or configure RLS policies as needed)

## 4. Fix the Supabase Client Configuration

If you're still experiencing issues, you might need to modify the Supabase client configuration. Here's a fixed version:

```typescript
// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Ensure the URL ends with no trailing slash
const cleanSupabaseUrl = supabaseUrl.replace(/\/$/, '');

export const supabase = createClient(cleanSupabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'careai-auth-token',
    storage: {
      getItem: (key) => {
        try {
          const storedSession = localStorage.getItem(key);
          if (!storedSession) return null;
          return storedSession;
        } catch (error) {
          console.error('Error retrieving session from localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error storing session in localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing session from localStorage:', error);
        }
      },
    },
    redirectTo: window.location.origin + '/auth/callback'
  },
  global: {
    headers: {
      'x-application-name': 'CareAI'
    },
    fetch: (url, options) => {
      // Add custom fetch logic for better error handling
      return fetch(url, {
        ...options,
        // Add a timeout to prevent hanging requests
        signal: options.signal || AbortSignal.timeout(30000) // 30 second timeout
      }).then(async (response) => {
        // Log failed requests for debugging
        if (!response.ok) {
          console.warn(`Supabase request failed: ${response.status} ${response.statusText}`, {
            url,
            method: options.method,
            headers: options.headers
          });

          // Try to get more details from the response
          try {
            const errorData = await response.clone().json();
            console.error('Error details:', errorData);
          } catch (e) {
            // Ignore JSON parsing errors
          }
        }
        return response;
      }).catch(error => {
        console.error(`Network error in Supabase request to ${url}:`, error);
        throw error;
      });
    }
  }
});

// Log Supabase configuration for debugging
console.log('Supabase URL:', cleanSupabaseUrl);
console.log('Supabase Auth Configuration:', {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: 'pkce',
  storageKey: 'careai-auth-token',
  customStorage: true,
  redirectTo: window.location.origin + '/auth/callback'
});
```

## 5. Fix the createPeerForumTables.ts File

The `createPeerForumTables.ts` file is trying to use the `execute_sql` RPC function, but it's failing. Here's a fixed version:

```typescript
// src/services/createPeerForumTables.ts
import { supabase } from '../lib/supabaseClient';

export const createPeerForumTablesDirectly = async (): Promise<boolean> => {
  try {
    console.log('Creating peer forum tables directly...');

    // Check if the peer_forum schema exists
    const { data: schemas, error: schemaError } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .eq('schema_name', 'peer_forum');

    if (schemaError) {
      console.error('Error checking for peer_forum schema:', schemaError);
      return false;
    }

    // If the schema doesn't exist, we need to create it
    if (!schemas || schemas.length === 0) {
      // Try to create the schema using a direct SQL query
      const { error: createSchemaError } = await supabase.rpc('execute_sql', {
        sql: 'CREATE SCHEMA IF NOT EXISTS peer_forum;'
      });

      if (createSchemaError) {
        console.error('Error creating peer_forum schema:', createSchemaError);
        return false;
      }
    }

    // Now check if the servers table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'peer_forum')
      .eq('table_name', 'servers');

    if (tableError) {
      console.error('Error checking for servers table:', tableError);
      return false;
    }

    // If the tables don't exist, we need to create them
    if (!tables || tables.length === 0) {
      // Redirect the user to run the SQL scripts manually
      console.log('Tables not found. Please run the SQL scripts manually.');
      alert('Peer forum tables not found. Please run the SQL scripts in the Supabase SQL Editor.');
      return false;
    }

    console.log('Peer forum tables already exist');
    return true;
  } catch (error) {
    console.error('Error in createPeerForumTablesDirectly:', error);
    return false;
  }
};

export default createPeerForumTablesDirectly;
```

## 6. Test the Connection

After making these changes, restart your application and test the connection to Supabase. You should no longer see the 404 and 406 errors in the console.
