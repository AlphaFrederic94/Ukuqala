import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import HealthRecordsList from '../../components/blockchain-health/HealthRecordsList';
import HealthRecordSharing from '../../components/blockchain-health/HealthRecordSharing';
import AddHealthRecord from '../../components/blockchain-health/AddHealthRecord';
import {
  Shield,
  FileText,
  Share2,
  Plus,
  Lock,
  Info
} from 'lucide-react';

const BlockchainHealthPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-6"
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('blockchainHealth.title', 'Secure Health Records')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {t('blockchainHealth.description', 'Store and share your health records securely using blockchain technology')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-start">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg mr-4">
            <Lock className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {t('blockchainHealth.secureStorage', 'Secure Storage')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('blockchainHealth.secureStorageDesc', 'Your health records are encrypted and stored securely on the blockchain.')}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-start">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg mr-4">
            <Shield className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {t('blockchainHealth.fullControl', 'Full Control')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('blockchainHealth.fullControlDesc', 'You control who can access your records and can revoke access at any time.')}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-start">
          <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg mr-4">
            <Share2 className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {t('blockchainHealth.secureSharing', 'Secure Sharing')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('blockchainHealth.secureSharingDesc', 'Share your records with healthcare providers securely and selectively.')}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="records" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="records" className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            {t('blockchainHealth.tabs.records', 'My Records')}
          </TabsTrigger>
          <TabsTrigger value="sharing" className="flex items-center">
            <Share2 className="w-4 h-4 mr-2" />
            {t('blockchainHealth.tabs.sharing', 'Sharing')}
          </TabsTrigger>
          <TabsTrigger id="add-record-tab" value="add" className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            {t('blockchainHealth.tabs.add', 'Add Record')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-0">
          <HealthRecordsList />
        </TabsContent>

        <TabsContent value="sharing" className="mt-0">
          <HealthRecordSharing />
        </TabsContent>

        <TabsContent value="add" className="mt-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('blockchainHealth.addRecord', 'Add Health Record')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t('blockchainHealth.addRecordDescription', 'Add new health records securely to the blockchain. Your data is encrypted and only accessible to you.')}
            </p>
            <AddHealthRecord />
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {t('blockchainHealth.aboutBlockchain', 'About Blockchain Health Records')}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {t('blockchainHealth.aboutBlockchainText', 'Blockchain technology provides a secure, immutable way to store and share your health records. Your data is encrypted and only accessible to those you explicitly grant permission. The blockchain ensures that your records cannot be altered or tampered with, providing a verifiable history of your health information.')}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BlockchainHealthPage;
