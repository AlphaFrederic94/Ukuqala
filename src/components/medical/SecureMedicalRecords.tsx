import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { secureStorageService } from '../../lib/secureStorageService';
import { Lock, Unlock, Save, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface MedicalRecord {
  allergies: string[];
  medications: string[];
  conditions: string[];
  bloodType: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  notes: string;
}

const defaultMedicalRecord: MedicalRecord = {
  allergies: [],
  medications: [],
  conditions: [],
  bloodType: '',
  emergencyContact: {
    name: '',
    relationship: '',
    phone: ''
  },
  notes: ''
};

const SecureMedicalRecords: React.FC = () => {
  const { user } = useAuth();
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord>(defaultMedicalRecord);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');
  const [itemType, setItemType] = useState<'allergies' | 'medications' | 'conditions'>('allergies');

  // Check if encryption is initialized
  useEffect(() => {
    const checkEncryption = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Try to fetch the user's encryption key record (not the actual key)
        const { data, error } = await supabase
          .from('user_encryption_keys')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking encryption status:', error);
        }
        
        setIsInitialized(!!data);
      } catch (error) {
        console.error('Error checking encryption status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkEncryption();
  }, [user]);

  // Initialize encryption
  const handleInitializeEncryption = async () => {
    if (!user) return;
    
    if (masterPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (masterPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await secureStorageService.initializeEncryption(user.id, masterPassword);
      
      if (success) {
        setIsInitialized(true);
        setSuccess('Encryption initialized successfully');
        
        // Get the encryption key
        const key = await secureStorageService.getUserEncryptionKey(user.id, masterPassword);
        setEncryptionKey(key);
        setIsUnlocked(true);
        
        // Initialize empty medical record
        await secureStorageService.storeEncryptedData(
          user.id,
          'medical_record',
          defaultMedicalRecord,
          key!
        );
        
        setMedicalRecord(defaultMedicalRecord);
      } else {
        setError('Failed to initialize encryption');
      }
    } catch (error) {
      console.error('Error initializing encryption:', error);
      setError('An error occurred while initializing encryption');
    } finally {
      setIsLoading(false);
    }
  };

  // Unlock medical records
  const handleUnlock = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const key = await secureStorageService.getUserEncryptionKey(user.id, masterPassword);
      
      if (!key) {
        setError('Incorrect password');
        return;
      }
      
      setEncryptionKey(key);
      setIsUnlocked(true);
      
      // Fetch medical record
      const data = await secureStorageService.getDecryptedData(user.id, 'medical_record', key);
      
      if (data) {
        setMedicalRecord(data);
      }
      
      setSuccess('Medical records unlocked');
    } catch (error) {
      console.error('Error unlocking medical records:', error);
      setError('An error occurred while unlocking medical records');
    } finally {
      setIsLoading(false);
    }
  };

  // Save medical record
  const handleSave = async () => {
    if (!user || !encryptionKey) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await secureStorageService.updateEncryptedData(
        user.id,
        'medical_record',
        medicalRecord,
        encryptionKey
      );
      
      if (success) {
        setSuccess('Medical records saved successfully');
      } else {
        setError('Failed to save medical records');
      }
    } catch (error) {
      console.error('Error saving medical records:', error);
      setError('An error occurred while saving medical records');
    } finally {
      setIsLoading(false);
    }
  };

  // Add item to list
  const handleAddItem = () => {
    if (!newItem.trim()) return;
    
    setMedicalRecord(prev => ({
      ...prev,
      [itemType]: [...prev[itemType], newItem.trim()]
    }));
    
    setNewItem('');
  };

  // Remove item from list
  const handleRemoveItem = (type: 'allergies' | 'medications' | 'conditions', index: number) => {
    setMedicalRecord(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setMedicalRecord(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof MedicalRecord],
          [child]: value
        }
      }));
    } else {
      setMedicalRecord(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Clear messages
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
        {isUnlocked ? (
          <Unlock className="mr-2 h-5 w-5 text-green-500" />
        ) : (
          <Lock className="mr-2 h-5 w-5 text-blue-500" />
        )}
        Secure Medical Records
      </h2>
      
      {/* Error and Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md flex justify-between items-center">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
          </div>
          <button onClick={clearMessages} className="text-red-700 dark:text-red-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md flex justify-between items-center">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
          </div>
          <button onClick={clearMessages} className="text-green-700 dark:text-green-400">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {!isInitialized ? (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Your medical records will be encrypted with end-to-end encryption. 
            Only you will be able to access them with your master password.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Create Master Password
            </label>
            <input
              type="password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter a strong password"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Master Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Confirm password"
            />
          </div>
          
          <div className="pt-2">
            <button
              onClick={handleInitializeEncryption}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Initializing...' : 'Initialize Encryption'}
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-md text-sm">
            <p className="font-medium">Important:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Your master password cannot be recovered if forgotten.</li>
              <li>Use a strong, unique password that you can remember.</li>
              <li>All your medical data will be encrypted with this password.</li>
            </ul>
          </div>
        </div>
      ) : !isUnlocked ? (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Enter your master password to unlock your encrypted medical records.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Master Password
            </label>
            <input
              type="password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter your master password"
            />
          </div>
          
          <div className="pt-2">
            <button
              onClick={handleUnlock}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Unlocking...' : 'Unlock Records'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Medical Record Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Blood Type
              </label>
              <select
                name="bloodType"
                value={medicalRecord.bloodType}
                onChange={(e) => setMedicalRecord(prev => ({ ...prev, bloodType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Blood Type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Emergency Contact
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  name="emergencyContact.name"
                  value={medicalRecord.emergencyContact.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Contact Name"
                />
                <input
                  type="text"
                  name="emergencyContact.relationship"
                  value={medicalRecord.emergencyContact.relationship}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Relationship"
                />
                <input
                  type="tel"
                  name="emergencyContact.phone"
                  value={medicalRecord.emergencyContact.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Phone Number"
                />
              </div>
            </div>
          </div>
          
          {/* Lists */}
          <div>
            <div className="flex space-x-2 mb-2">
              <button
                onClick={() => setItemType('allergies')}
                className={`px-3 py-1 rounded-md ${
                  itemType === 'allergies'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                Allergies
              </button>
              <button
                onClick={() => setItemType('medications')}
                className={`px-3 py-1 rounded-md ${
                  itemType === 'medications'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                Medications
              </button>
              <button
                onClick={() => setItemType('conditions')}
                className={`px-3 py-1 rounded-md ${
                  itemType === 'conditions'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                Conditions
              </button>
            </div>
            
            <div className="flex mb-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder={`Add ${itemType}`}
              />
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add
              </button>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 min-h-[100px] max-h-[200px] overflow-y-auto">
              {medicalRecord[itemType].length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No {itemType} added yet
                </p>
              ) : (
                <ul className="space-y-1">
                  {medicalRecord[itemType].map((item, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="text-gray-800 dark:text-gray-200">{item}</span>
                      <button
                        onClick={() => handleRemoveItem(itemType, index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={medicalRecord.notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Add any additional medical information here..."
            ></textarea>
          </div>
          
          {/* Save Button */}
          <div>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Medical Records
                </>
              )}
            </button>
          </div>
          
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md text-sm">
            <p className="font-medium">Security Information:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Your medical data is encrypted end-to-end.</li>
              <li>Data is only decrypted locally in your browser.</li>
              <li>No one else can access this information, not even our staff.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecureMedicalRecords;
