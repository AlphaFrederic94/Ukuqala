// Script to create required Firebase indexes using the Firebase CLI
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the firestore.indexes.json file
const indexesFilePath = path.join(__dirname, '../firestore.indexes.json');
const indexesContent = {
  "indexes": [
    {
      "collectionGroup": "saved_posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "social_posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
};

// Write the indexes file
fs.writeFileSync(indexesFilePath, JSON.stringify(indexesContent, null, 2));
console.log(`Created ${indexesFilePath}`);

// Deploy the indexes using Firebase CLI
console.log('Deploying indexes to Firebase...');
exec('firebase deploy --only firestore:indexes', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error deploying indexes: ${error.message}`);
    console.log('\nPlease create the indexes manually through the Firebase Console:');
    console.log('1. For saved_posts collection:');
    console.log('   Fields: userId (Ascending), createdAt (Descending)');
    console.log('2. For notifications collection:');
    console.log('   Fields: userId (Ascending), createdAt (Descending)');
    console.log('3. For social_posts collection:');
    console.log('   Fields: createdAt (Descending)');
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  
  console.log(`stdout: ${stdout}`);
  console.log('Indexes deployed successfully!');
});
