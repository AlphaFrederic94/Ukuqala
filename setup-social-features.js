// This script sets up the social features in the CareAI application
// It provides instructions for executing the SQL script in the Supabase SQL editor
// and checks if the social features are properly set up

import { supabase } from './src/lib/supabaseClient.js';
import { checkSocialFeatures } from './src/lib/checkSocialFeatures.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupSocialFeatures() {
  console.log('\n=====================================================');
  console.log('  SOCIAL FEATURES SETUP UTILITY');
  console.log('=====================================================\n');

  // Check if social features are already set up
  console.log('Checking if social features are already set up...');
  const status = await checkSocialFeatures();

  if (status.isFullySetup) {
    console.log('\n✅ Social features are already properly set up!\n');
    console.log('Tables found:');
    Object.entries(status.tableStatus).forEach(([table, exists]) => {
      console.log(`  - ${table}: ${exists ? '✅' : '❌'}`);
    });
    console.log(`Storage bucket: ${status.storageBucketExists ? '✅' : '❌'}`);
    console.log(`Stored procedures: ${status.storedProceduresExist ? '✅' : '❌'}`);
    console.log('\nYou can now use the social features in the CareAI application.');
    return;
  }

  console.log('\n❌ Social features are not fully set up.\n');
  console.log('Tables found:');
  Object.entries(status.tableStatus || {}).forEach(([table, exists]) => {
    console.log(`  - ${table}: ${exists ? '✅' : '❌'}`);
  });
  console.log(`Storage bucket: ${status.storageBucketExists ? '✅' : '❌'}`);
  console.log(`Stored procedures: ${status.storedProceduresExist ? '✅' : '❌'}`);

  // Read the SQL script
  const sqlPath = path.join(__dirname, 'public', 'fix_social_features.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('\n❌ Error: fix_social_features.sql file not found!');
    console.log('Please make sure the file exists in the public directory of the project.');
    return;
  }

  const sqlScript = fs.readFileSync(sqlPath, 'utf8');

  console.log('\n=====================================================');
  console.log('  SETUP INSTRUCTIONS');
  console.log('=====================================================\n');
  console.log('To fix the social features in your CareAI application,');
  console.log('you need to execute the SQL script in the Supabase SQL editor.\n');
  console.log('Follow these steps:\n');
  console.log('1. Log in to your Supabase dashboard');
  console.log('2. Go to the SQL Editor');
  console.log('3. Create a new query');
  console.log('4. Copy and paste the following SQL script:');
  console.log('\n-----------------------------------------------------\n');
  console.log(sqlScript);
  console.log('\n-----------------------------------------------------\n');
  console.log('5. Run the query');
  console.log('6. Restart your application\n');

  // Try to open the Supabase dashboard
  const openBrowser = process.platform === 'win32'
    ? 'start'
    : process.platform === 'darwin'
      ? 'open'
      : 'xdg-open';

  try {
    const { exec } = await import('child_process');
    exec(`${openBrowser} https://app.supabase.com/project/_/sql`, (error) => {
      if (error) {
        console.error('Could not open browser automatically. Please open your Supabase dashboard manually.');
      } else {
        console.log('Opening Supabase dashboard in your browser...');
      }
    });
  } catch (error) {
    console.error('Could not open browser automatically. Please open your Supabase dashboard manually.');
  }

  console.log('\nAfter running the script, restart this utility to verify that the social features are properly set up.');
  console.log('\n=====================================================\n');
}

setupSocialFeatures().catch(error => {
  console.error('Error setting up social features:', error);
});
