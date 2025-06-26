import React, { useState } from 'react';
import { Shield, Lock, Bell, Eye, EyeOff, Moon, Sun, RefreshCw, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import ChangePasswordForm from './ChangePasswordForm';
import MFASetup from './MFASetup';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface SecuritySectionProps {
  autoSaveEnabled?: boolean;
  onToggleAutoSave?: () => void;
  lastSaved?: Date | null;
  initialShowChangePassword?: boolean;
}

const SecuritySection: React.FC<SecuritySectionProps> = ({
  autoSaveEnabled = true,
  onToggleAutoSave = () => {},
  lastSaved = null,
  initialShowChangePassword = false
}) => {
  const [showChangePassword, setShowChangePassword] = useState(initialShowChangePassword);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const { isMFAEnabled } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold dark:text-white flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Security & Privacy
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Password Section */}
        <motion.div variants={itemVariants} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
          <AnimatePresence mode="wait">
            {showChangePassword ? (
              <motion.div
                key="change-password-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ChangePasswordForm
                  onSuccess={() => setShowChangePassword(false)}
                  onCancel={() => setShowChangePassword(false)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="password-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mr-4 card-icon">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="card-content">
                    <h4 className="text-lg font-medium dark:text-white">Password & Authentication</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your password and login settings</p>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <Button
                    className="w-full justify-center button-hover"
                    variant="outline"
                    onClick={() => setShowChangePassword(true)}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>

                  <div
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors card-hover"
                    onClick={() => setShowMFASetup(true)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3 card-icon">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="card-content">
                        <h5 className="font-medium dark:text-white">Two-Factor Authentication</h5>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {isMFAEnabled ? 'Enabled - Click to manage' : 'Disabled - Click to set up'}
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        id="toggle-2fa"
                        checked={isMFAEnabled}
                        readOnly
                      />
                      <div className="block bg-gray-300 dark:bg-gray-600 w-14 h-8 rounded-full"></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${isMFAEnabled ? 'translate-x-6' : ''}`}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* MFA Setup Modal */}
        <AnimatePresence>
          {showMFASetup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 overflow-y-auto"
            >
              <div className="flex items-center justify-center min-h-screen p-4">
                <motion.div
                  className="fixed inset-0 bg-black bg-opacity-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMFASetup(false)}
                />

                <motion.div
                  className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
                  initial={{ scale: 0.9, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: 20, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                  <div className="p-6">
                    <MFASetup
                      onSuccess={() => setShowMFASetup(false)}
                      onCancel={() => setShowMFASetup(false)}
                    />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Privacy Section */}
        <motion.div variants={itemVariants} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mr-4">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-lg font-medium dark:text-white">Privacy Settings</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Control your data and privacy preferences</p>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h5 className="font-medium dark:text-white">Share my health data with doctors</h5>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Allow doctors to access your health records</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  id="toggle-share-data"
                  defaultChecked
                />
                <div className="block bg-gray-300 dark:bg-gray-600 w-14 h-8 rounded-full"></div>
                <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform translate-x-6"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h5 className="font-medium dark:text-white">Email notifications</h5>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Receive email updates about your account</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  id="toggle-email"
                  defaultChecked
                />
                <div className="block bg-gray-300 dark:bg-gray-600 w-14 h-8 rounded-full"></div>
                <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform translate-x-6"></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Appearance Section */}
        <motion.div variants={itemVariants} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 mr-4 card-icon">
              {darkMode ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </div>
            <div className="card-content">
              <h4 className="text-lg font-medium dark:text-white">Appearance</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Customize how CareAI looks for you</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div
              onClick={toggleDarkMode}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors card-hover"
            >
              <div className="flex items-center">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                ) : (
                  <Sun className="w-5 h-5 text-orange-500 mr-3" />
                )}
                <h5 className="font-medium dark:text-white">
                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                </h5>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  id="toggle-theme"
                  checked={darkMode}
                  readOnly
                />
                <div className="block bg-gray-300 dark:bg-gray-600 w-14 h-8 rounded-full"></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${darkMode ? 'translate-x-6' : ''}`}></div>
              </div>
            </div>

            <div
              onClick={onToggleAutoSave}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors card-hover"
            >
              <div className="flex items-center">
                <RefreshCw className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                <div>
                  <h5 className="font-medium dark:text-white">Auto-Save Changes</h5>
                  {lastSaved && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  id="toggle-autosave"
                  checked={autoSaveEnabled}
                  readOnly
                />
                <div className="block bg-gray-300 dark:bg-gray-600 w-14 h-8 rounded-full"></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${autoSaveEnabled ? 'translate-x-6' : ''}`}></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SecuritySection;
