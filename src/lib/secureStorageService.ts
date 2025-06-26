import { supabase } from './supabaseClient';
import { 
  encryptData, 
  decryptData, 
  generateEncryptionKey, 
  exportKey, 
  importKey,
  encryptWithPassword,
  decryptWithPassword
} from '../utils/encryption';

/**
 * Service for securely storing and retrieving sensitive user data
 * Uses end-to-end encryption to ensure data privacy
 */
export const secureStorageService = {
  /**
   * Initialize encryption for a user
   * Generates a new encryption key and stores it securely
   */
  async initializeEncryption(userId: string, masterPassword: string): Promise<boolean> {
    try {
      // Generate a new encryption key
      const encryptionKey = await generateEncryptionKey();
      
      // Export the key to a string format
      const exportedKey = await exportKey(encryptionKey);
      
      // Encrypt the key with the user's master password
      const encryptedKey = await encryptWithPassword(exportedKey, masterPassword);
      
      // Store the encrypted key in the database
      const { error } = await supabase
        .from('user_encryption_keys')
        .insert({
          user_id: userId,
          encrypted_key: encryptedKey
        });
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error initializing encryption:', error);
      return false;
    }
  },
  
  /**
   * Get the user's encryption key
   */
  async getUserEncryptionKey(userId: string, masterPassword: string): Promise<CryptoKey | null> {
    try {
      // Fetch the encrypted key from the database
      const { data, error } = await supabase
        .from('user_encryption_keys')
        .select('encrypted_key')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      if (!data) return null;
      
      // Decrypt the key with the master password
      const exportedKey = await decryptWithPassword(data.encrypted_key, masterPassword);
      
      // Import the key
      return await importKey(exportedKey);
    } catch (error) {
      console.error('Error getting user encryption key:', error);
      return null;
    }
  },
  
  /**
   * Store encrypted data in the database
   */
  async storeEncryptedData(
    userId: string, 
    dataType: string, 
    data: any, 
    encryptionKey: CryptoKey
  ): Promise<string | null> {
    try {
      // Convert data to string if it's an object
      const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
      
      // Encrypt the data
      const encryptedData = await encryptData(dataString, encryptionKey);
      
      // Store in the database
      const { data: result, error } = await supabase
        .from('encrypted_user_data')
        .insert({
          user_id: userId,
          data_type: dataType,
          encrypted_data: encryptedData
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      return result.id;
    } catch (error) {
      console.error('Error storing encrypted data:', error);
      return null;
    }
  },
  
  /**
   * Retrieve and decrypt data from the database
   */
  async getDecryptedData(
    userId: string, 
    dataType: string, 
    encryptionKey: CryptoKey
  ): Promise<any | null> {
    try {
      // Fetch the encrypted data
      const { data, error } = await supabase
        .from('encrypted_user_data')
        .select('encrypted_data')
        .eq('user_id', userId)
        .eq('data_type', dataType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // No data found
        throw error;
      }
      
      if (!data) return null;
      
      // Decrypt the data
      const decryptedString = await decryptData(data.encrypted_data, encryptionKey);
      
      // Try to parse as JSON, return as string if not valid JSON
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString;
      }
    } catch (error) {
      console.error('Error getting decrypted data:', error);
      return null;
    }
  },
  
  /**
   * Update encrypted data in the database
   */
  async updateEncryptedData(
    userId: string, 
    dataType: string, 
    data: any, 
    encryptionKey: CryptoKey
  ): Promise<boolean> {
    try {
      // Convert data to string if it's an object
      const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
      
      // Encrypt the data
      const encryptedData = await encryptData(dataString, encryptionKey);
      
      // Check if data exists
      const { data: existingData, error: checkError } = await supabase
        .from('encrypted_user_data')
        .select('id')
        .eq('user_id', userId)
        .eq('data_type', dataType)
        .limit(1)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      
      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('encrypted_user_data')
          .update({
            encrypted_data: encryptedData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
        
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('encrypted_user_data')
          .insert({
            user_id: userId,
            data_type: dataType,
            encrypted_data: encryptedData
          });
        
        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating encrypted data:', error);
      return false;
    }
  },
  
  /**
   * Delete encrypted data from the database
   */
  async deleteEncryptedData(userId: string, dataType: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('encrypted_user_data')
        .delete()
        .eq('user_id', userId)
        .eq('data_type', dataType);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting encrypted data:', error);
      return false;
    }
  },
  
  /**
   * Change the master password
   */
  async changeMasterPassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<boolean> {
    try {
      // Get the current encryption key
      const encryptionKey = await this.getUserEncryptionKey(userId, currentPassword);
      
      if (!encryptionKey) {
        throw new Error('Current password is incorrect');
      }
      
      // Export the key
      const exportedKey = await exportKey(encryptionKey);
      
      // Encrypt with the new password
      const newEncryptedKey = await encryptWithPassword(exportedKey, newPassword);
      
      // Update in the database
      const { error } = await supabase
        .from('user_encryption_keys')
        .update({
          encrypted_key: newEncryptedKey,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error changing master password:', error);
      return false;
    }
  }
};
