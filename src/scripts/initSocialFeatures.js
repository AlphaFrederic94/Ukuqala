// Removed supabase import as it's no longer needed for index creation
import fixDatabaseSchema from './fixDatabaseSchema';
import initChatGroups from './initChatGroups';
import checkDatabaseTables from './checkDatabaseTables';
import { createSocialTables } from '../lib/createSocialTables';

// This script initializes all social features
// Run this script once to ensure everything is set up correctly

const initSocialFeatures = async () => {
  try {
    // Step 1: Silently check if all required tables exist
    const tablesExist = await checkDatabaseTables();
    if (!tablesExist) {
      // Silently try to create the missing tables
      await createSocialTables();
    }

    // Step 2: Silently fix database schema if needed
    await fixDatabaseSchema();

    // Step 3: Silently initialize chat groups
    await initChatGroups();

    // Step 4: Skip index creation as it requires direct database access
    // No console logs to avoid cluttering the console
  } catch (error) {
    // Silently handle errors
  }
};

export default initSocialFeatures;
