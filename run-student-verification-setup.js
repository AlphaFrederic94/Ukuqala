/**
 * Script to run the student verification setup SQL in Supabase
 * 
 * This script reads the setup-student-verification.sql file and executes it
 * in the Supabase database.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read the SQL file
const sqlFilePath = path.join(process.cwd(), 'setup-student-verification.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Split the SQL content into individual statements
const statements = sqlContent
  .split(';')
  .map(statement => statement.trim())
  .filter(statement => statement.length > 0);

// Execute each SQL statement
async function executeStatements() {
  console.log(`Found ${statements.length} SQL statements to execute`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    
    try {
      const { error } = await supabase.rpc('execute_sql', { sql: statement });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        
        // Try direct query as fallback
        try {
          console.log('Trying direct query as fallback...');
          const { error: directError } = await supabase.sql(statement);
          
          if (directError) {
            console.error('Direct query also failed:', directError);
          } else {
            console.log('Direct query succeeded');
          }
        } catch (directQueryError) {
          console.error('Error with direct query:', directQueryError);
        }
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
      }
    } catch (error) {
      console.error(`Error with statement ${i + 1}:`, error);
    }
  }
}

// Run the script
executeStatements()
  .then(() => {
    console.log('Student verification setup complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error setting up student verification:', error);
    process.exit(1);
  });
