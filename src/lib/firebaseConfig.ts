// Firebase configuration for the CareAI social features
// This file contains the Firebase configuration and initialization

import firebase from '../firebase-compat';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCpaH2_eU4sBYwoJU7dUUhaWLcoOQdfkz0",
  authDomain: "careaiproto.firebaseapp.com",
  projectId: "careaiproto",
  storageBucket: "careaiproto.firebasestorage.app",
  messagingSenderId: "521435078556",
  appId: "1:521435078556:web:5833977c31e66e4dcab259",
  measurementId: "G-5DRH8ZLEXP"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = app.analytics();
const db = app.firestore();
const auth = app.auth();
const storage = app.storage();
const messaging = app.messaging();

export { app, db, auth, storage, messaging, analytics };
