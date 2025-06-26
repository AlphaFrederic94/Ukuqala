/**
 * Script to set up Firebase collections for the Student Hub feature
 * Run this script with: node scripts/setup-firebase-collections.js
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';

// Load service account from file
const serviceAccountPath = new URL('../serviceAccountKey.json', import.meta.url);
const serviceAccountJson = JSON.parse(await readFile(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccountJson)
});

const db = getFirestore();

// Collection names
const COLLECTIONS = {
  NOTES: 'student_hub_notes',
  ROADMAPS: 'student_hub_roadmaps',
  MILESTONES: 'milestones', // Subcollection of roadmaps
  USER_DASHBOARD: 'student_hub_user_dashboard'
};

// Create collections and sample documents
async function setupCollections() {
  console.log('Setting up Firebase collections for Student Hub...');

  try {
    // Check if collections already exist
    const notesCollection = await db.collection(COLLECTIONS.NOTES).limit(1).get();
    const roadmapsCollection = await db.collection(COLLECTIONS.ROADMAPS).limit(1).get();
    const dashboardCollection = await db.collection(COLLECTIONS.USER_DASHBOARD).limit(1).get();

    if (!notesCollection.empty && !roadmapsCollection.empty && !dashboardCollection.empty) {
      console.log('Collections already exist. Skipping creation.');
      return;
    }

    // Create sample user dashboard
    await db.collection(COLLECTIONS.USER_DASHBOARD).doc('mock-user-id-123').set({
      userId: 'mock-user-id-123',
      flashcardsCompleted: 250,
      studyStreak: 14,
      questionsAnswered: 500,
      minutesStudied: 2500,
      lastUpdated: FieldValue.serverTimestamp()
    });
    console.log('Created sample user dashboard');

    // Create sample notes
    const sampleNotes = [
      {
        userId: 'mock-user-id-123',
        title: 'Cardiovascular System Overview',
        content: '# Cardiovascular System\n\n## Heart Structure\n- Four chambers: two atria and two ventricles\n- Valves: mitral, tricuspid, aortic, pulmonary\n\n## Blood Flow\n- Pulmonary circulation: right heart → lungs → left heart\n- Systemic circulation: left heart → body → right heart',
        subject: 'Anatomy',
        tags: ['cardiovascular', 'heart', 'circulation'],
        isFavorite: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      },
      {
        userId: 'mock-user-id-123',
        title: 'Neurology Basics',
        content: '# Neurology Basics\n\n## Brain Anatomy\n- Cerebrum: frontal, parietal, temporal, occipital lobes\n- Cerebellum: coordination, balance\n- Brainstem: midbrain, pons, medulla\n\n## Spinal Cord\n- 31 pairs of spinal nerves\n- Reflex arcs',
        subject: 'Neurology',
        tags: ['brain', 'nervous system', 'neurology'],
        isFavorite: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }
    ];

    for (const note of sampleNotes) {
      await db.collection(COLLECTIONS.NOTES).add(note);
    }
    console.log('Created sample notes');

    // Create sample roadmap
    const roadmapRef = await db.collection(COLLECTIONS.ROADMAPS).add({
      userId: 'mock-user-id-123',
      title: 'USMLE Step 1 Preparation',
      description: 'My comprehensive study plan for USMLE Step 1',
      examType: 'USMLE',
      examLevel: 'Step 1',
      examDate: new Date('2023-12-15'),
      createdAt: FieldValue.serverTimestamp()
    });

    // Add milestones to the roadmap
    const sampleMilestones = [
      {
        title: 'Complete First Aid review',
        description: 'Read through First Aid for USMLE Step 1 and take notes',
        section: 'Study Materials',
        completed: true,
        dueDate: new Date('2023-09-15'),
        createdAt: FieldValue.serverTimestamp()
      },
      {
        title: 'UWorld Question Bank - First Pass',
        description: 'Complete first pass of UWorld question bank with minimum 60% correct',
        section: 'Question Banks',
        completed: false,
        dueDate: new Date('2023-10-30'),
        createdAt: FieldValue.serverTimestamp()
      },
      {
        title: 'NBME Practice Exam 1',
        description: 'Take NBME Practice Exam 1 and review all questions',
        section: 'Practice Exams',
        completed: false,
        dueDate: new Date('2023-11-15'),
        createdAt: FieldValue.serverTimestamp()
      }
    ];

    for (const milestone of sampleMilestones) {
      await db.collection(COLLECTIONS.ROADMAPS)
        .doc(roadmapRef.id)
        .collection(COLLECTIONS.MILESTONES)
        .add(milestone);
    }
    console.log('Created sample roadmap with milestones');

    console.log('Firebase collections setup completed successfully!');
  } catch (error) {
    console.error('Error setting up Firebase collections:', error);
  }
}

// Run the setup
setupCollections()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
