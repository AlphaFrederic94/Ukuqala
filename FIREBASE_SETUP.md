# Firebase Setup for Student Hub

This document provides instructions on how to set up Firebase for the Student Hub feature.

## Prerequisites

1. Firebase project with Firestore enabled
2. Firebase Admin SDK service account key

## Setup Instructions

### 1. Get Firebase Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Save the JSON file as `serviceAccountKey.json` in the root of the project

### 2. Install Firebase Admin SDK

```bash
npm install firebase-admin
```

### 3. Run the Setup Script

```bash
node scripts/setup-firebase-collections.js
```

This script will create the following collections in Firestore:

- `student_hub_notes`: Collection for storing notes
- `student_hub_roadmaps`: Collection for storing exam roadmaps
  - `milestones`: Subcollection of roadmaps for storing milestones
- `student_hub_user_dashboard`: Collection for storing user dashboard data

### 4. Verify Collections

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Firestore Database
4. Verify that the collections have been created

## Collection Structure

### student_hub_notes

```
{
  userId: string,
  title: string,
  content: string,
  subject: string,
  tags: string[],
  isFavorite: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### student_hub_roadmaps

```
{
  userId: string,
  title: string,
  description: string,
  examType: string,
  examLevel: string,
  examDate: timestamp,
  createdAt: timestamp
}
```

### milestones (subcollection of roadmaps)

```
{
  title: string,
  description: string,
  section: string,
  completed: boolean,
  dueDate: timestamp,
  createdAt: timestamp
}
```

### student_hub_user_dashboard

```
{
  userId: string,
  flashcardsCompleted: number,
  studyStreak: number,
  questionsAnswered: number,
  minutesStudied: number,
  lastUpdated: timestamp
}
```

## Troubleshooting

If you encounter any issues with the setup script, check the following:

1. Make sure the `serviceAccountKey.json` file is in the root of the project
2. Make sure the Firebase project has Firestore enabled
3. Make sure the service account has the necessary permissions

If you need to manually create the collections, you can use the Firebase Console or the Firebase Admin SDK.
