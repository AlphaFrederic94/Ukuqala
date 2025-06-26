// Script to create required Firebase indexes
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createIndexes() {
  console.log('Creating required Firebase indexes...');

  try {
    // Create index for saved_posts collection
    await db.collection('saved_posts')
      .where('userId', '==', 'test')
      .orderBy('createdAt', 'desc')
      .get();
    console.log('Index for saved_posts created or already exists');

    // Create index for notifications collection
    await db.collection('notifications')
      .where('user_id', '==', 'test')
      .orderBy('created_at', 'desc')
      .get();
    console.log('Index for notifications created or already exists');

    console.log('All indexes created successfully!');
    console.log('Note: You may need to follow the links in the Firebase console to complete the index creation.');
  } catch (error) {
    console.error('Error creating indexes:', error);
    console.log('Please follow these links to create the indexes manually:');
    console.log('1. For saved_posts: https://console.firebase.google.com/v1/r/project/careaiproto/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9jYXJlYWlwcm90by9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvc2F2ZWRfcG9zdHMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg');
    console.log('2. For notifications: https://console.firebase.google.com/v1/r/project/careaiproto/firestore/indexes?create_composite=ClFwcm9qZWN0cy9jYXJlYWlwcm90by9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbm90aWZpY2F0aW9ucy9pbmRleGVzL18QARoLCgd1c2VyX2lkEAEaDgoKY3JlYXRlZF9hdBACGgwKCF9fbmFtZV9fEAI');
  }
}

createIndexes().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
