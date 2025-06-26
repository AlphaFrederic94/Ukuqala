import React, { createContext, useContext, useState, useEffect } from 'react';
import firebase from '../firebase-compat';
import { auth } from '../lib/firebaseConfig';
import firebaseAuthService from '../lib/firebaseAuthService';
import firebaseSocialService from '../lib/firebaseSocialService';
import firebaseMessagingService from '../lib/firebaseMessagingService';
import { useAuth } from './AuthContext';

type User = firebase.User;

// Context type
interface FirebaseContextType {
  currentUser: User | null;
  loading: boolean;
  authService: typeof firebaseAuthService;
  socialService: typeof firebaseSocialService;
  messagingService: typeof firebaseMessagingService;
}

// Create context
const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

// Provider component
export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authContext = useAuth();
  const setUser = authContext?.setUser;

  useEffect(() => {
    // Initialize Firebase collections and default chat groups
    const initializeFirebase = async () => {
      try {
        // First initialize collections
        await firebaseSocialService.initializeFirebaseCollections();
        // Then initialize default chat groups
        await firebaseSocialService.initializeDefaultChatGroups();
      } catch (error) {
        console.error('Error initializing Firebase:', error);
      }
    };

    // Run initialization in a non-blocking way
    initializeFirebase().catch(err => {
      console.error('Failed to initialize Firebase:', err);
    });

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);

      // Update the Supabase auth context if user changes
      if (user) {
        // Get user profile from Firestore
        firebaseAuthService.getUserProfile(user.uid)
          .then(profile => {
            if (profile && setUser) {
              // Update Supabase auth context
              setUser({
                id: user.uid,
                email: user.email || '',
                user_metadata: {
                  full_name: profile.displayName,
                  avatar_url: profile.photoURL
                }
              });

              // Request notification permission in a non-blocking way
              setTimeout(() => {
                firebaseMessagingService.requestNotificationPermission(user.uid)
                  .catch(err => {
                    console.error('Error requesting notification permission:', err);
                  });
              }, 2000); // Delay by 2 seconds to ensure other initialization is complete
            }
          })
          .catch(error => {
            console.error('Error getting user profile:', error);
          });
      } else {
        // Clear Supabase auth context
        if (setUser) {
          setUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  const value = {
    currentUser,
    loading,
    authService: firebaseAuthService,
    socialService: firebaseSocialService,
    messagingService: firebaseMessagingService
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Hook to use the Firebase context
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
