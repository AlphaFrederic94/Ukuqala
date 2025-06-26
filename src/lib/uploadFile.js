import { storage } from './firebaseConfig';

export const uploadFile = async (file, path) => {
  try {
    // Create a reference to the file location
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

export const deleteFile = async (path) => {
  try {
    const storageRef = storage.ref(path);
    await storageRef.delete();
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
