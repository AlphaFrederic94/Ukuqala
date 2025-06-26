import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

const AccountDeletion: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
    setError(null);
    setPassword('');
    setConfirmText('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    // Validate confirmation text
    if (confirmText !== 'DELETE') {
      setError(t('profile.confirmDeleteText'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Verify password first
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: password,
      });

      if (authError) {
        setError(t('auth.invalidCredentials'));
        setIsLoading(false);
        return;
      }

      // Delete user data from all tables
      // This is a cascading delete, so we don't need to delete from all tables manually
      // if the foreign keys are set up correctly with ON DELETE CASCADE

      // Delete the user's auth account
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Log the user out
      await logout();
      
      // Redirect to login page
      navigate('/login', { 
        state: { 
          message: t('profile.accountDeleted'),
          type: 'success' 
        } 
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      setError(t('errors.somethingWentWrong'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
        <Trash2 className="mr-2 h-5 w-5 text-red-500" />
        {t('profile.deleteAccount')}
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {t('profile.deleteAccountDescription')}
      </p>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={openModal}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          {t('profile.deleteAccount')}
        </button>
      </div>

      {/* Delete Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center mb-4 text-red-600">
              <AlertTriangle className="h-8 w-8 mr-3" />
              <h3 className="text-xl font-bold">{t('profile.deleteAccountConfirmation')}</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('profile.deleteAccountWarning')}
              </p>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {t('profile.deleteAccountIrreversible')}
                </p>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder={t('auth.enterPassword')}
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('profile.typeToConfirm', { text: 'DELETE' })}
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="DELETE"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading || confirmText !== 'DELETE' || !password}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    {t('common.processing')}
                  </>
                ) : (
                  t('profile.permanentlyDelete')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDeletion;
