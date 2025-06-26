import { storage } from './firebaseConfig';

/**
 * Upload a file to Firebase Storage
 * @param file The file to upload
 * @param path The path in Firebase Storage where the file should be stored
 * @returns The download URL of the uploaded file
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    // Create a storage reference
    const storageRef = storage.ref(path);
    
    // Upload the file
    const uploadTask = await storageRef.put(file);
    
    // Get the download URL
    const downloadURL = await uploadTask.ref.getDownloadURL();
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 * @param url The download URL of the file to delete
 */
export const deleteFile = async (url: string): Promise<void> => {
  try {
    // Extract the path from the URL
    const decodedUrl = decodeURIComponent(url);
    const startIndex = decodedUrl.indexOf('/o/') + 3;
    const endIndex = decodedUrl.indexOf('?');
    const path = decodedUrl.substring(startIndex, endIndex);
    
    // Create a reference to the file
    const fileRef = storage.ref(path);
    
    // Delete the file
    await fileRef.delete();
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
