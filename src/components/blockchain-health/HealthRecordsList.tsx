import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import blockchainService from '../../lib/blockchainService';
import {
  Shield,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Share2,
  Lock,
  Eye,
  Plus,
  Search,
  Filter,
  Loader2,
  Download,
  File,
  Image,
  ExternalLink
} from 'lucide-react';

const HealthRecordsList: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [decryptedData, setDecryptedData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [verificationStatus, setVerificationStatus] = useState<{[key: string]: boolean | null}>({});

  // Fetch user's health records
  useEffect(() => {
    const fetchRecords = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Initialize blockchain service
        await blockchainService.initialize();

        // Set encryption key (in a real app, this would be derived from user credentials)
        const encryptionKey = blockchainService.generateEncryptionKey(
          user.id,
          'careai-health-records'
        );
        blockchainService.setEncryptionKey(encryptionKey);

        // Fetch records
        const records = await blockchainService.getUserHealthRecords(user.id);
        setRecords(records);
      } catch (error) {
        console.error('Error fetching health records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [user]);

  // Filter and search records
  const filteredRecords = records.filter(record => {
    // Filter by type
    if (filterType !== 'all' && record.record_type !== filterType) {
      return false;
    }

    // Search by record type or blockchain ID
    if (searchTerm && !record.record_type.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !record.blockchain_id.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  // View record details
  const viewRecord = async (record: any) => {
    try {
      setSelectedRecord(record);

      // Decrypt the record data
      const fullRecord = await blockchainService.getHealthRecord(record.id);
      setDecryptedData(fullRecord.data);

      // Verify the record on the blockchain
      const isVerified = await blockchainService.verifyHealthRecord(record.id);
      setVerificationStatus(prev => ({
        ...prev,
        [record.id]: isVerified
      }));
    } catch (error) {
      console.error('Error viewing record:', error);
      setDecryptedData(null);
      setVerificationStatus(prev => ({
        ...prev,
        [record.id]: false
      }));
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get record type icon
  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'medical_test':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'vaccination':
        return <Shield className="w-5 h-5 text-green-500" />;
      case 'prescription':
        return <FileText className="w-5 h-5 text-purple-500" />;
      case 'diagnosis':
        return <FileText className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
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
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('healthRecords.yourRecords', 'Your Health Records')}
        </h3>
        <button
          className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          onClick={() => document.getElementById('add-record-tab')?.click()}
        >
          <Plus className="w-4 h-4 mr-1" />
          {t('healthRecords.addRecord', 'Add Record')}
        </button>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('healthRecords.searchRecords', 'Search records...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center">
            <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
            <select
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">{t('healthRecords.allTypes', 'All Types')}</option>
              <option value="medical_test">{t('healthRecords.medicalTest', 'Medical Test')}</option>
              <option value="vaccination">{t('healthRecords.vaccination', 'Vaccination')}</option>
              <option value="prescription">{t('healthRecords.prescription', 'Prescription')}</option>
              <option value="diagnosis">{t('healthRecords.diagnosis', 'Diagnosis')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors ${
                selectedRecord?.id === record.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => viewRecord(record)}
            >
              <div className="flex items-start">
                <div className="mr-3">
                  {getRecordTypeIcon(record.record_type)}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {getRecordTypeLabel(record.record_type)}
                    </h4>
                    <div className="flex items-center">
                      {verificationStatus[record.id] === true && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t('healthRecords.verified', 'Verified')}
                        </span>
                      )}
                      {verificationStatus[record.id] === false && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          <XCircle className="w-3 h-3 mr-1" />
                          {t('healthRecords.notVerified', 'Not Verified')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(record.created_at)}
                    {record.file_url && (
                      <span className="ml-2 inline-flex items-center">
                        <File className="w-3 h-3 mr-1 text-blue-500" />
                        {t('healthRecords.hasAttachment', 'Has attachment')}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                    ID: {record.blockchain_id}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <FileText className="w-8 h-8 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {t('healthRecords.noRecords', 'No Health Records Found')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {searchTerm || filterType !== 'all'
                ? t('healthRecords.noMatchingRecords', 'No records match your search criteria')
                : t('healthRecords.addYourFirstRecord', 'Add your first health record to get started')}
            </p>
          </div>
        )}
      </div>

      {selectedRecord && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('healthRecords.recordDetails', 'Record Details')}
              </h3>
              <div className="flex space-x-2">
                <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Eye className="w-4 h-4 mr-1" />
                  {t('healthRecords.view', 'View')}
                </button>
                <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Share2 className="w-4 h-4 mr-1" />
                  {t('healthRecords.share', 'Share')}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('healthRecords.recordType', 'Record Type')}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {getRecordTypeLabel(selectedRecord.record_type)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('healthRecords.createdAt', 'Created At')}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedRecord.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('healthRecords.blockchainId', 'Blockchain ID')}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {selectedRecord.blockchain_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('healthRecords.verificationStatus', 'Verification Status')}
                  </p>
                  <div className="flex items-center">
                    {verificationStatus[selectedRecord.id] === true ? (
                      <span className="inline-flex items-center text-sm font-medium text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {t('healthRecords.verified', 'Verified')}
                      </span>
                    ) : verificationStatus[selectedRecord.id] === false ? (
                      <span className="inline-flex items-center text-sm font-medium text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4 mr-1" />
                        {t('healthRecords.notVerified', 'Not Verified')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        {t('healthRecords.verifying', 'Verifying...')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {decryptedData ? (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t('healthRecords.recordContent', 'Record Content')}
                </h4>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-auto max-h-64">
                  <div className="mb-4">
                    <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {decryptedData.name}
                    </h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {t('healthRecords.date', 'Date')}: {decryptedData.date}
                    </p>
                    <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {decryptedData.details}
                    </p>
                  </div>

                  {/* File attachment */}
                  {selectedRecord.file_url && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('healthRecords.attachment', 'Attachment')}
                      </h5>
                      <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        {decryptedData.file_type?.startsWith('image/') ? (
                          <div className="mr-3">
                            <Image className="w-5 h-5 text-blue-500" />
                          </div>
                        ) : decryptedData.file_type === 'application/pdf' ? (
                          <div className="mr-3">
                            <File className="w-5 h-5 text-red-500" />
                          </div>
                        ) : (
                          <div className="mr-3">
                            <File className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-grow">
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                            {decryptedData.file_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {decryptedData.file_size ? `${(decryptedData.file_size / 1024 / 1024).toFixed(2)} MB` : ''}
                            {decryptedData.file_type ? ` • ${decryptedData.file_type.split('/')[1].toUpperCase()}` : ''}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <a
                            href={selectedRecord.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <a
                            href={selectedRecord.file_url}
                            download
                            className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <Lock className="w-3 h-3 mr-1" />
                {t('healthRecords.encryptedSecure', 'Encrypted and secured with blockchain technology')}
              </div>
              <button className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                {t('healthRecords.deleteRecord', 'Delete Record')}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default HealthRecordsList;
