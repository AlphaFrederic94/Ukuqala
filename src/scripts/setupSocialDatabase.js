import { supabase } from '../lib/supabaseClient';
import fs from 'fs';
import path from 'path';

/**
 * This script sets up the social database tables and permissions
 * It reads the SQL from fix_social_features.sql and executes it
 * Then it verifies that all required tables exist
 */
async function setupSocialDatabase() {
  try {
    console.log('Setting up social database...');
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'fix_social_features.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // If the RPC doesn't exist, we'll need to create it first
      if (error.message.includes('function "exec_sql" does not exist')) {
        console.log('Creating exec_sql function...');
        
        // Create the exec_sql function
        const createFunctionSql = `
          CREATE OR REPLACE FUNCTION exec_sql(sql text)
          RETURNS void AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
          
          GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
          GRANT EXECUTE ON FUNCTION exec_sql(text) TO anon;
        `;
        
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createFunctionSql });
        
        if (createError) {
          console.error('Error creating exec_sql function:', createError);
          
          // If we can't create the function, we'll need to execute the SQL in chunks
          console.log('Executing SQL in chunks...');
          
          // Split the SQL into individual statements
          const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
          
          for (const statement of statements) {
            const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
            if (stmtError) {
              console.error(`Error executing statement: ${statement}`, stmtError);
            }
          }
        } else {
          // Try executing the original SQL again
          const { error: retryError } = await supabase.rpc('exec_sql', { sql });
          if (retryError) {
            console.error('Error executing SQL after creating function:', retryError);
          }
        }
      }
    }
    
    // Verify tables exist
    await verifyTables();
    
    console.log('Social database setup complete!');
  } catch (error) {
    console.error('Error setting up social database:', error);
  }
}

async function verifyTables() {
  const requiredTables = [
    'social_posts',
    'post_comments',
    'post_likes',
    'user_friendships',
    'chat_messages'
  ];
  
  console.log('Verifying tables...');
  
  for (const table of requiredTables) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') { // relation does not exist
        console.error(`Table ${table} does not exist!`);
      } else {
        console.error(`Error checking table ${table}:`, error);
      }
    } else {
      console.log(`Table ${table} exists.`);
    }
  }
  
  // Check storage bucket
  const { data: buckets, error: bucketsError } = await supabase
    .storage
    .listBuckets();
  
  if (bucketsError) {
    console.error('Error checking storage buckets:', bucketsError);
  } else {
    const socialBucket = buckets.find(b => b.name === 'social');
    if (socialBucket) {
      console.log('Social storage bucket exists.');
    } else {
      console.error('Social storage bucket does not exist!');
    }
  }
}

// Run the setup
setupSocialDatabase();
