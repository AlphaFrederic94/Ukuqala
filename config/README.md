# CareAI Configuration

This directory contains configuration files for the CareAI project.

## Configuration Files

- `.env` - Environment variables
- `firebase.json` - Firebase configuration
- `firestore.rules` - Firestore security rules
- `storage.rules` - Firebase Storage security rules
- `.firebaserc` - Firebase project configuration
- `cors.json` - CORS configuration for Firebase Storage

## Environment Variables

The `.env` file should contain the following variables:

```
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# API Keys
VITE_NEWS_API_KEY=your_news_api_key
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key
```

## Firebase Configuration

The Firebase configuration files include:

- `firebase.json` - Main Firebase configuration
- `firestore.rules` - Security rules for Firestore
- `storage.rules` - Security rules for Firebase Storage
- `.firebaserc` - Firebase project configuration

### Firebase Indexes

Firebase indexes are configured in `firebase.json`. The required indexes include:

- Notifications collection: Composite index on user_id (ascending) and created_at (descending)
- Chat messages: Composite index on chat_id (ascending) and created_at (ascending)
- Social posts: Composite index on created_at (descending)

## CORS Configuration

The `cors.json` file configures Cross-Origin Resource Sharing (CORS) for Firebase Storage. This allows the frontend to access files stored in Firebase Storage.

## Usage

These configuration files are used by various parts of the application:

- Environment variables are loaded by Vite during the build process
- Firebase configuration is used by the Firebase SDK
- Firestore and Storage rules are deployed to Firebase
- CORS configuration is applied to Firebase Storage

## Updating Configuration

When updating configuration:

1. Make changes to the appropriate configuration file
2. Test the changes locally
3. Deploy the changes to the appropriate service
4. Update documentation if necessary
