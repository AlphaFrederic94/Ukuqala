import { ethers } from 'ethers';
import { supabase } from './supabaseClient';
import CryptoJS from 'crypto-js';

// ABI for the Health Records smart contract
const healthRecordsABI = [
  "function storeRecord(string recordHash, uint256 timestamp, string metadata) public returns (uint256)",
  "function verifyRecord(string recordHash, uint256 recordId) public view returns (bool)",
  "function getRecordTimestamp(uint256 recordId) public view returns (uint256)",
  "function getRecordMetadata(uint256 recordId) public view returns (string)",
  "function grantAccess(address provider, uint256 recordId) public",
  "function revokeAccess(address provider, uint256 recordId) public",
  "function hasAccess(address provider, uint256 recordId) public view returns (bool)"
];

// This would be the deployed contract address in a production environment
// For demo purposes, we'll use a placeholder
const contractAddress = "0x0000000000000000000000000000000000000000";

class BlockchainService {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private isInitialized: boolean = false;
  private encryptionKey: string | null = null;

  // Initialize the blockchain connection
  async initialize(): Promise<boolean> {
    try {
      // In a real implementation, this would connect to an actual blockchain
      // For demo purposes, we'll simulate the blockchain functionality

      // Set a default encryption key for demo purposes
      if (!this.encryptionKey) {
        this.encryptionKey = 'default-encryption-key-for-demo-purposes-only';
        console.log('Using default encryption key for demo');
      }

      // Simulate successful initialization
      this.isInitialized = true;
      console.log('Blockchain service initialized (simulation mode)');
      return true;
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      return false;
    }
  }

  // Set the encryption key for the current user
  setEncryptionKey(key: string): void {
    this.encryptionKey = key;
  }

  // Generate an encryption key from a password
  generateEncryptionKey(password: string, salt: string): string {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 1000
    }).toString();
  }

  // Encrypt health data
  encryptData(data: any): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not set');
    }

    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
  }

  // Decrypt health data
  decryptData(encryptedData: string): any {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not set');
    }

    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  }

  // Create a hash of the health record
  createRecordHash(data: any): string {
    const jsonString = JSON.stringify(data);
    return CryptoJS.SHA256(jsonString).toString();
  }

  // Store a health record on the blockchain
  async storeHealthRecord(userId: string, recordType: string, data: any, fileUrl: string | null = null): Promise<{ recordId: string, blockchainId: string }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Encrypt the data
      const encryptedData = this.encryptData(data);

      // Create a hash of the original data for verification
      const recordHash = this.createRecordHash(data);

      // Create metadata
      const metadata = JSON.stringify({
        recordType,
        createdAt: new Date().toISOString(),
        userId,
        hasFile: !!fileUrl
      });

      // In a real implementation, this would call the smart contract
      // For demo purposes, we'll simulate the blockchain transaction

      // Simulate blockchain transaction
      const blockchainId = this.simulateBlockchainTransaction(recordHash, metadata);

      // Store the record in the database
      const { data: record, error } = await supabase
        .from('blockchain_health_records')
        .insert([{
          user_id: userId,
          record_type: recordType,
          encrypted_data: encryptedData,
          record_hash: recordHash,
          blockchain_id: blockchainId,
          file_url: fileUrl,
          created_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (error) throw error;

      return {
        recordId: record.id,
        blockchainId
      };
    } catch (error) {
      console.error('Error storing health record on blockchain:', error);
      throw error;
    }
  }

  // Verify a health record against the blockchain
  async verifyHealthRecord(recordId: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get the record from the database
      const { data: record, error } = await supabase
        .from('blockchain_health_records')
        .select('record_hash, blockchain_id')
        .eq('id', recordId)
        .single();

      if (error) throw error;

      // In a real implementation, this would call the smart contract
      // For demo purposes, we'll simulate the verification

      // Simulate blockchain verification
      return this.simulateBlockchainVerification(record.record_hash, record.blockchain_id);
    } catch (error) {
      console.error('Error verifying health record:', error);
      return false;
    }
  }

  // Get a health record
  async getHealthRecord(recordId: string): Promise<any> {
    try {
      // Get the record from the database
      const { data: record, error } = await supabase
        .from('blockchain_health_records')
        .select('*')
        .eq('id', recordId)
        .single();

      if (error) throw error;

      // Decrypt the data
      const decryptedData = this.decryptData(record.encrypted_data);

      return {
        ...record,
        data: decryptedData
      };
    } catch (error) {
      console.error('Error getting health record:', error);
      throw error;
    }
  }

  // Get all health records for a user
  async getUserHealthRecords(userId: string): Promise<any[]> {
    try {
      // Get the records from the database
      const { data: records, error } = await supabase
        .from('blockchain_health_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Return the records without decrypting them
      // They will be decrypted when accessed individually
      return records || [];
    } catch (error) {
      console.error('Error getting user health records:', error);
      throw error;
    }
  }

  // Grant access to a health record
  async grantAccess(recordId: string, providerUserId: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get the record to verify ownership
      const { data: record, error } = await supabase
        .from('blockchain_health_records')
        .select('user_id, blockchain_id')
        .eq('id', recordId)
        .single();

      if (error) throw error;

      // In a real implementation, this would call the smart contract
      // For demo purposes, we'll simulate the access grant

      // Store the access grant in the database
      const { error: accessError } = await supabase
        .from('blockchain_health_record_access')
        .insert([{
          record_id: recordId,
          provider_user_id: providerUserId,
          granted_at: new Date().toISOString()
        }]);

      if (accessError) throw accessError;

      return true;
    } catch (error) {
      console.error('Error granting access to health record:', error);
      return false;
    }
  }

  // Revoke access to a health record
  async revokeAccess(recordId: string, providerUserId: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get the record to verify ownership
      const { data: record, error } = await supabase
        .from('blockchain_health_records')
        .select('user_id, blockchain_id')
        .eq('id', recordId)
        .single();

      if (error) throw error;

      // In a real implementation, this would call the smart contract
      // For demo purposes, we'll simulate the access revocation

      // Remove the access grant from the database
      const { error: accessError } = await supabase
        .from('blockchain_health_record_access')
        .delete()
        .match({
          record_id: recordId,
          provider_user_id: providerUserId
        });

      if (accessError) throw accessError;

      return true;
    } catch (error) {
      console.error('Error revoking access to health record:', error);
      return false;
    }
  }

  // Check if a provider has access to a health record
  async checkAccess(recordId: string, providerUserId: string): Promise<boolean> {
    try {
      // Check if access has been granted in the database
      const { data, error } = await supabase
        .from('blockchain_health_record_access')
        .select('*')
        .match({
          record_id: recordId,
          provider_user_id: providerUserId
        })
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"

      return !!data;
    } catch (error) {
      console.error('Error checking access to health record:', error);
      return false;
    }
  }

  // Simulation methods for demo purposes
  private simulateBlockchainTransaction(recordHash: string, metadata: string): string {
    // Generate a random blockchain ID
    const blockchainId = Math.random().toString(36).substring(2, 15) +
                         Math.random().toString(36).substring(2, 15);

    console.log(`Simulated blockchain transaction: ${blockchainId}`);
    console.log(`Record hash: ${recordHash}`);
    console.log(`Metadata: ${metadata}`);

    return blockchainId;
  }

  private simulateBlockchainVerification(recordHash: string, blockchainId: string): boolean {
    // In a real implementation, this would verify the record on the blockchain
    // For demo purposes, we'll always return true
    console.log(`Simulated blockchain verification for record: ${blockchainId}`);
    console.log(`Record hash: ${recordHash}`);

    return true;
  }
}

export const blockchainService = new BlockchainService();
export default blockchainService;
