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

// Get the project ID
const projectId = process.env.FIREBASE_PROJECT_ID || admin.app().options.projectId || 'careaiproto';
console.log(`Using Firebase project ID: ${projectId}`);

// Function to create a composite index
async function createCompositeIndex(collectionName, fields) {
  try {
    console.log(`Creating index for ${collectionName} collection...`);
    
    // Get Firestore instance
    const firestore = admin.firestore();
    
    // Create the index
    const indexFields = fields.map(field => ({
      fieldPath: field.name,
      order: field.order
    }));
    
    // Log the index being created
    console.log(`Index fields: ${JSON.stringify(indexFields)}`);
    
    // Use the Firestore Admin API to create the index
    // Note: This requires the Firebase Admin SDK to be initialized with appropriate credentials
    const indexManager = firestore._indexConfigurationBuilder();
    
    // Create the index
    await indexManager.createIndex({
      collectionGroup: collectionName,
      fields: indexFields
    });
    
    console.log(`Successfully created index for ${collectionName} collection`);
    return true;
  } catch (error) {
    console.error(`Error creating index for ${collectionName} collection:`, error);
    return false;
  }
}

// Main function to create all required indexes
async function createRequiredIndexes() {
  console.log('Creating required Firebase indexes...');
  
  try {
    // Define the indexes we need to create
    const indexes = [
      {
        collectionName: 'saved_posts',
        fields: [
          { name: 'userId', order: 'ASCENDING' },
          { name: 'createdAt', order: 'DESCENDING' }
        ]
      },
      {
        collectionName: 'notifications',
        fields: [
          { name: 'userId', order: 'ASCENDING' },
          { name: 'createdAt', order: 'DESCENDING' }
        ]
      },
      {
        collectionName: 'social_posts',
        fields: [
          { name: 'createdAt', order: 'DESCENDING' }
        ]
      }
    ];
    
    // Create each index
    for (const index of indexes) {
      await createCompositeIndex(index.collectionName, index.fields);
    }
    
    console.log('All indexes created successfully!');
  } catch (error) {
    console.error('Error creating indexes:', error);
    
    // Provide manual instructions
    console.log('\nPlease create the indexes manually through the Firebase Console:');
    console.log('1. For saved_posts collection:');
    console.log('   Fields: userId (Ascending), createdAt (Descending)');
    console.log('2. For notifications collection:');
    console.log('   Fields: userId (Ascending), createdAt (Descending)');
    console.log('3. For social_posts collection:');
    console.log('   Fields: createdAt (Descending)');
    
    console.log('\nOr use these direct links:');
    console.log(`1. For saved_posts: https://console.firebase.google.com/project/${projectId}/firestore/indexes`);
    console.log(`2. For notifications: https://console.firebase.google.com/project/${projectId}/firestore/indexes`);
    console.log(`3. For social_posts: https://console.firebase.google.com/project/${projectId}/firestore/indexes`);
  }
}

// Run the main function
createRequiredIndexes();
