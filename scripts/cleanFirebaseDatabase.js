import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCvwdlrxYcYLlHlXpjnqKBZvxoGX0Xpxc",
  authDomain: "careaiproto.firebaseapp.com",
  projectId: "careaiproto",
  storageBucket: "careaiproto.appspot.com",
  messagingSenderId: "521435078556",
  appId: "1:521435078556:web:c5a1c5693a9b9e7e4e5e4e"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

async function cleanDatabase() {
  console.log('Starting database cleanup...');

  // Collections to clean
  const collections = [
    'social_posts',
    'post_comments',
    'post_likes',
    'chat_messages',
    'notifications'
  ];

  for (const collectionName of collections) {
    try {
      console.log(`Cleaning collection: ${collectionName}`);

      // Get all documents in the collection
      const snapshot = await db.collection(collectionName).get();

      if (snapshot.empty) {
        console.log(`  Collection ${collectionName} is already empty`);
        continue;
      }

      console.log(`  Found ${snapshot.size} documents to delete`);

      // Delete in batches (Firestore has a limit of 500 operations per batch)
      const batchSize = 400;
      let count = 0;
      let batch = db.batch();

      for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
        count++;

        if (count >= batchSize) {
          console.log(`  Committing batch of ${count} deletions...`);
          await batch.commit();
          batch = db.batch();
          count = 0;
        }
      }

      // Commit any remaining deletions
      if (count > 0) {
        console.log(`  Committing final batch of ${count} deletions...`);
        await batch.commit();
      }

      console.log(`  Successfully cleaned collection: ${collectionName}`);
    } catch (error) {
      console.error(`Error cleaning collection ${collectionName}:`, error);
    }
  }

  console.log('Database cleanup completed!');
}

// Run the cleanup
cleanDatabase()
  .then(() => {
    console.log('All done! Exiting...');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error during cleanup:', error);
    process.exit(1);
  });
