import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Lock, Globe, Moon, Eye, UserCog, Accessibility, Sun, Monitor } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import AccessibilitySettings from '../components/settings/AccessibilitySettings';

export default function Settings() {
  const { language, timezone, setLanguage, setTimezone } = useSettings();
  const { darkMode, themeMode, setThemeMode } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimezone(e.target.value);
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">{t('common.settings')}</h1>

        {/* Settings Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'general'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'accessibility'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setActiveTab('accessibility')}
          >
            <span className="flex items-center">
              <Accessibility className="h-4 w-4 mr-1" />
              Accessibility
            </span>
          </button>
        </div>

        {activeTab === 'general' ? (
          <div className="space-y-6">
            {/* Account Settings */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center dark:text-white">
              <UserCog className="h-5 w-5 mr-2" />
              {t('settings.account')}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium dark:text-white">{t('settings.email')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.changeEmail')}</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {t('common.update')}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium dark:text-white">{t('settings.password')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.changePassword')}</p>
                </div>
                <button
                  onClick={() => navigate('/profile', { state: { activeTab: 'security', showChangePassword: true } })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('common.change')}
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center dark:text-white">
              <Bell className="h-5 w-5 mr-2" />
              {t('settings.notifications')}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium dark:text-white">{t('settings.emailNotifications')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.receiveEmails')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium dark:text-white">{t('settings.appointmentReminders')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.reminderDesc')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center dark:text-white">
              <Eye className="h-5 w-5 mr-2" />
              {t('settings.preferences')}
            </h2>
            <div className="space-y-4">
              {/* Theme Settings */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium dark:text-white">Theme</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred theme mode</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      themeMode === 'light'
                        ? 'bg-spotify-green text-black font-semibold'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Sun className="h-4 w-4 mr-1" />
                    Light
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      themeMode === 'dark'
                        ? 'bg-spotify-green text-black font-semibold'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Moon className="h-4 w-4 mr-1" />
                    Dark
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      themeMode === 'system'
                        ? 'bg-spotify-green text-black font-semibold'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Monitor className="h-4 w-4 mr-1" />
                    System
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium dark:text-white">{t('settings.language')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.languageDesc')}</p>
                </div>
                <select
                  value={language}
                  onChange={handleLanguageChange}
                  className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium dark:text-white">{t('settings.timezone')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.timezoneDesc')}</p>
                </div>
                <select
                  value={timezone}
                  onChange={handleTimezoneChange}
                  className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        ) : activeTab === 'accessibility' ? (
          <AccessibilitySettings />
        ) : null}
      </div>
    </div>
  );
}