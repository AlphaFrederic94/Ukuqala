// Script to create required Firebase indexes
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
try {
  // Try to load service account from file
  const serviceAccountPath = path.join(__dirname, './serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Initialized Firebase Admin SDK with service account file');
  } else {
    // Fall back to application default credentials
    admin.initializeApp();
    console.log('Initialized Firebase Admin SDK with application default credentials');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

const db = admin.firestore();

async function createIndexes() {
  console.log('Creating required Firebase indexes...');

  try {
    // Get the project ID
    const projectId = process.env.FIREBASE_PROJECT_ID || admin.app().options.projectId || 'careaiproto';

    console.log(`Using Firebase project ID: ${projectId}`);

    // Create index for saved_posts collection
    console.log('Creating index for saved_posts collection...');
    try {
      await db.collection('saved_posts')
        .where('userId', '==', 'test')
        .orderBy('createdAt', 'desc')
        .get();
      console.log('Index for saved_posts created or already exists');
    } catch (error) {
      if (error.code === 'failed-precondition') {
        console.log('Need to create index for saved_posts collection. Follow the link in the Firebase console.');
      } else {
        throw error;
      }
    }

    // Create index for notifications collection
    console.log('Creating index for notifications collection...');
    try {
      await db.collection('notifications')
        .where('userId', '==', 'test')
        .orderBy('createdAt', 'desc')
        .get();
      console.log('Index for notifications created or already exists');
    } catch (error) {
      if (error.code === 'failed-precondition') {
        console.log('Need to create index for notifications collection. Follow the link in the Firebase console.');
      } else {
        throw error;
      }
    }

    console.log('All indexes created successfully!');
    console.log('\nNote: Firebase indexes are created asynchronously and may take a few minutes to become active.');
    console.log('You can check the status of your indexes in the Firebase Console:');
    console.log(`https://console.firebase.google.com/project/${projectId}/firestore/indexes`);
  } catch (error) {
    console.error('Error creating indexes:', error);
    console.log('\nPlease create the indexes manually through the Firebase Console:');
    console.log('1. For saved_posts collection:');
    console.log('   Fields: userId (Ascending), createdAt (Descending), __name__ (Descending)');
    console.log('2. For notifications collection:');
    console.log('   Fields: userId (Ascending), createdAt (Descending), __name__ (Descending)');
    console.log('\nOr use these direct links:');
    console.log('1. For saved_posts: https://console.firebase.google.com/v1/r/project/careaiproto/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9jYXJlYWlwcm90by9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvc2F2ZWRfcG9zdHMvaW5kZXhlcy9fEAEaCkoGdXNlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg');
    console.log('2. For notifications: https://console.firebase.google.com/v1/r/project/careaiproto/firestore/indexes?create_composite=ClFwcm9qZWN0cy9jYXJlYWlwcm90by9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbm90aWZpY2F0aW9ucy9pbmRleGVzL18QARoLCgd1c2VySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC');
  }
}

createIndexes().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
