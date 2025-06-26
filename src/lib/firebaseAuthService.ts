import firebase from '../firebase-compat';
import { auth, db, storage } from './firebaseConfig';

type User = firebase.User;
type UserCredential = firebase.auth.UserCredential;

// Types
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Register a new user
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> => {
  try {
    // Create user in Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Update profile with display name
    await user.updateProfile({ displayName });

    // Create user profile in Firestore
    await createUserProfile(user, { displayName });

    return userCredential;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    return await auth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const userCredential = await auth.signInWithPopup(provider);

    // Check if user profile exists
    const user = userCredential.user;
    const profileExists = await checkUserProfileExists(user.uid);

    if (!profileExists) {
      // Create user profile in Firestore
      await createUserProfile(user);
    }

    return userCredential;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await auth.sendPasswordResetEmail(email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (
  user: User,
  profile: Partial<UserProfile>
): Promise<void> => {
  try {
    // Update profile in Firebase Auth
    if (profile.displayName || profile.photoURL) {
      await user.updateProfile({
        displayName: profile.displayName,
        photoURL: profile.photoURL
      });
    }

    // Update profile in Firestore
    const userRef = db.collection('user_profiles').doc(user.uid);
    await userRef.update({
      ...profile,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Update user email
export const updateUserEmail = async (
  user: User,
  newEmail: string,
  password: string
): Promise<void> => {
  try {
    // Re-authenticate user
    const credential = firebase.auth.EmailAuthProvider.credential(user.email!, password);
    await user.reauthenticateWithCredential(credential);

    // Update email
    await user.updateEmail(newEmail);

    // Update email in Firestore
    const userRef = db.collection('user_profiles').doc(user.uid);
    await userRef.update({
      email: newEmail,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user email:', error);
    throw error;
  }
};

// Update user password
export const updateUserPassword = async (
  user: User,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  try {
    // Re-authenticate user
    const credential = firebase.auth.EmailAuthProvider.credential(user.email!, currentPassword);
    await user.reauthenticateWithCredential(credential);

    // Update password
    await user.updatePassword(newPassword);
  } catch (error) {
    console.error('Error updating user password:', error);
    throw error;
  }
};

// Upload profile picture
export const uploadProfilePicture = async (
  userId: string,
  file: File
): Promise<string> => {
  try {
    // Upload file to Firebase Storage
    const storageRef = storage.ref(`avatars/${userId}`);
    await storageRef.put(file);

    // Get download URL
    const downloadURL = await storageRef.getDownloadURL();

    // Update user profile
    const user = auth.currentUser;
    if (user) {
      await user.updateProfile({ photoURL: downloadURL });

      // Update profile in Firestore
      const userRef = db.collection('user_profiles').doc(userId);
      await userRef.update({
        photoURL: downloadURL,
        updatedAt: new Date()
      });
    }

    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = db.collection('user_profiles').doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      } as UserProfile;
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Check if user profile exists
export const checkUserProfileExists = async (userId: string): Promise<boolean> => {
  try {
    const userRef = db.collection('user_profiles').doc(userId);
    const userDoc = await userRef.get();
    return userDoc.exists;
  } catch (error) {
    console.error('Error checking user profile:', error);
    return false;
  }
};

// Create user profile in Firestore
export const createUserProfile = async (
  user: User,
  additionalData: Partial<UserProfile> = {}
): Promise<void> => {
  try {
    const userRef = db.collection('user_profiles').doc(user.uid);

    // Create profile
    await userRef.set({
      id: user.uid,
      email: user.email,
      displayName: user.displayName || additionalData.displayName || '',
      photoURL: user.photoURL || '',
      bio: additionalData.bio || '',
      location: additionalData.location || '',
      website: additionalData.website || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Export the service
const firebaseAuthService = {
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  resetPassword,
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  uploadProfilePicture,
  getUserProfile,
  checkUserProfileExists,
  createUserProfile
};

export default firebaseAuthService;
