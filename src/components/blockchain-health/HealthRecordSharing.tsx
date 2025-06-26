import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import blockchainService from '../../lib/blockchainService';
import { supabase } from '../../lib/supabaseClient';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Clock, 
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Shield
} from 'lucide-react';

const HealthRecordSharing: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [sharedWith, setSharedWith] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch user's health records and providers
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch records
        const records = await blockchainService.getUserHealthRecords(user.id);
        setRecords(records);
        
        // Fetch healthcare providers (in a real app, this would be from a providers database)
        // For demo, we'll use other users as providers
        const { data: providerUsers, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .neq('id', user.id)
          .limit(10);
          
        if (error) throw error;
        
        setProviders(providerUsers || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  // Fetch sharing information when a record is selected
  useEffect(() => {
    const fetchSharingInfo = async () => {
      if (!selectedRecord) return;
      
      try {
        setSharingLoading(true);
        
        // Fetch users who have access to this record
        const { data, error } = await supabase
          .from('blockchain_health_record_access')
          .select('provider_user_id, granted_at')
          .eq('record_id', selectedRecord);
          
        if (error) throw error;
        
        if (data) {
          // Get provider details for each access grant
          const providerIds = data.map(access => access.provider_user_id);
          
          if (providerIds.length > 0) {
            const { data: providerDetails, error: providersError } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', providerIds);
              
            if (providersError) throw providersError;
            
            // Combine access grants with provider details
            const sharedWithDetails = providerDetails?.map(provider => {
              const accessGrant = data.find(access => access.provider_user_id === provider.id);
              return {
                ...provider,
                granted_at: accessGrant?.granted_at
              };
            });
            
            setSharedWith(sharedWithDetails || []);
          } else {
            setSharedWith([]);
          }
        }
      } catch (error) {
        console.error('Error fetching sharing info:', error);
      } finally {
        setSharingLoading(false);
      }
    };
    
    fetchSharingInfo();
  }, [selectedRecord]);
  
  // Grant access to a provider
  const grantAccess = async (providerId: string) => {
    if (!selectedRecord || !user) return;
    
    try {
      setSharingLoading(true);
      
      // Grant access using blockchain service
      const success = await blockchainService.grantAccess(selectedRecord, providerId);
      
      if (success) {
        // Refresh sharing info
        const { data: accessData, error: accessError } = await supabase
          .from('blockchain_health_record_access')
          .select('provider_user_id, granted_at')
          .eq('record_id', selectedRecord);
          
        if (accessError) throw accessError;
        
        // Get provider details
        const { data: providerDetails, error: providerError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', providerId)
          .single();
          
        if (providerError) throw providerError;
        
        // Add to shared with list
        const accessGrant = accessData?.find(access => access.provider_user_id === providerId);
        
        setSharedWith([
          ...sharedWith,
          {
            ...providerDetails,
            granted_at: accessGrant?.granted_at
          }
        ]);
      }
    } catch (error) {
      console.error('Error granting access:', error);
    } finally {
      setSharingLoading(false);
    }
  };
  
  // Revoke access from a provider
  const revokeAccess = async (providerId: string) => {
    if (!selectedRecord || !user) return;
    
    try {
      setSharingLoading(true);
      
      // Revoke access using blockchain service
      const success = await blockchainService.revokeAccess(selectedRecord, providerId);
      
      if (success) {
        // Remove from shared with list
        setSharedWith(sharedWith.filter(provider => provider.id !== providerId));
      }
    } catch (error) {
      console.error('Error revoking access:', error);
    } finally {
      setSharingLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Get record type label
  const getRecordTypeLabel = (type: string) => {
    switch (type) {
      case 'medical_test':
        return t('healthRecords.medicalTest', 'Medical Test');
      case 'vaccination':
        return t('healthRecords.vaccination', 'Vaccination');
      case 'prescription':
        return t('healthRecords.prescription', 'Prescription');
      case 'diagnosis':
        return t('healthRecords.diagnosis', 'Diagnosis');
      default:
        return type;
    }
  };
  
  // Filter providers by search term
  const filteredProviders = providers.filter(provider => {
    if (!searchTerm) return true;
    return provider.full_name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('healthRecords.shareRecords', 'Share Health Records')}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('healthRecords.shareDescription', 'Securely share your health records with healthcare providers')}
        </p>
      </div>
      
      <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('healthRecords.selectRecord', 'Select a record to share')}
        </label>
        <select
          className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={selectedRecord || ''}
          onChange={(e) => setSelectedRecord(e.target.value)}
        >
          <option value="">{t('healthRecords.selectRecord', 'Select a record')}</option>
          {records.map((record) => (
            <option key={record.id} value={record.id}>
              {getRecordTypeLabel(record.record_type)} - {formatDate(record.created_at)}
            </option>
          ))}
        </select>
      </div>
      
      {selectedRecord && (
        <div className="p-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              {t('healthRecords.currentlySharedWith', 'Currently shared with')}
            </h4>
            
            {sharingLoading ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : sharedWith.length > 0 ? (
              <div className="space-y-3">
                {sharedWith.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                        {provider.avatar_url ? (
                          <img 
                            src={provider.avatar_url} 
                            alt={provider.full_name} 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                          {provider.full_name}
                        </h5>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {t('healthRecords.sharedOn', 'Shared on')} {formatDate(provider.granted_at)}
                        </div>
                      </div>
                    </div>
                    <button
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => revokeAccess(provider.id)}
                    >
                      <UserMinus className="w-3 h-3 mr-1" />
                      {t('healthRecords.revoke', 'Revoke')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {t('healthRecords.notShared', 'Not shared with anyone')}
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('healthRecords.privateRecord', 'This record is currently private')}
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {t('healthRecords.shareWith', 'Share with a healthcare provider')}
              </h4>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('healthRecords.searchProviders', 'Search providers...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredProviders.length > 0 ? (
                filteredProviders.map((provider) => {
                  const isShared = sharedWith.some(p => p.id === provider.id);
                  
                  return (
                    <div key={provider.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                          {provider.avatar_url ? (
                            <img 
                              src={provider.avatar_url} 
                              alt={provider.full_name} 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                            {provider.full_name}
                          </h5>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Healthcare Provider
                          </div>
                        </div>
                      </div>
                      {isShared ? (
                        <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {t('healthRecords.alreadyShared', 'Already shared')}
                        </div>
                      ) : (
                        <button
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => grantAccess(provider.id)}
                          disabled={sharingLoading}
                        >
                          {sharingLoading ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <UserPlus className="w-3 h-3 mr-1" />
                          )}
                          {t('healthRecords.share', 'Share')}
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {t('healthRecords.noProvidersFound', 'No providers found')}
                  </h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {searchTerm
                      ? t('healthRecords.noMatchingProviders', 'No providers match your search')
                      : t('healthRecords.noProviders', 'No healthcare providers available')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {!selectedRecord && (
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
            <Shield className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {t('healthRecords.selectToShare', 'Select a Record to Share')}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {records.length > 0
              ? t('healthRecords.selectRecordPrompt', 'Please select a health record to share with healthcare providers')
              : t('healthRecords.noRecordsToShare', 'You don\'t have any health records to share yet')}
          </p>
        </div>
      )}
      
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
          <div>
            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {t('healthRecords.secureSharing', 'Secure Blockchain Sharing')}
            </h5>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {t('healthRecords.secureDescription', 'Your health records are encrypted and securely shared using blockchain technology. You maintain full control over who can access your records and can revoke access at any time.')}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HealthRecordSharing;
