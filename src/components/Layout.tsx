import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Activity,
  Calendar,
  Heart,
  BarChart2,
  Settings,
  User,
  Sun,
  Moon,
  Github,
  Linkedin,
  Info,
  Apple,
  Utensils,
  Droplet,
  PieChart,
  CloudSun,
  Bot,
  Users,
  Dna,
  Shield,
  MapPin,
  Crown,
  CreditCard
} from 'lucide-react';

import TimeDisplay from './TimeDisplay';
import SocialInitializer from './SocialInitializer';
import PWAInstallPrompt from './PWAInstallPrompt';
import FloatingChatbotButton from './FloatingChatbotButton';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { t } = useTranslation();
  const { language, timezone } = useSettings();
  const { darkMode, toggleDarkMode } = useTheme();

  const navigation = [
    { name: t('common.home'), href: '/home', icon: Home },
    { name: t('common.predictions'), href: '/predictions', icon: Activity },
    { name: t('common.appointments'), href: '/appointments', icon: Calendar },
    { name: 'Medical Facilities', href: '/medical-facilities', icon: MapPin },
    { name: t('common.nutrition'), href: '/nutrition', icon: Apple },
    { name: t('common.healthTips'), href: '/health-tips', icon: Heart },
    { name: t('common.weather'), href: '/weather', icon: CloudSun },
    { name: t('social.social'), href: '/social', icon: Users },
    { name: t('common.analytics'), href: '/analytics', icon: BarChart2 },
    { name: t('chatbot.title'), href: '/chatbot', icon: Bot },
    { name: 'Digital Twin', href: '/digital-twin', icon: Dna },
    { name: 'Secure Records', href: '/blockchain-health', icon: Shield },
    { name: 'Subscription', href: '/subscription', icon: Crown },
    { name: t('common.profile'), href: '/profile', icon: User },
    { name: t('common.settings'), href: '/settings', icon: Settings },
  ];

  const nutritionSubMenu = [
    { name: t('nutrition.dashboard'), href: '/nutrition', icon: Apple },
    { name: t('nutrition.meals'), href: '/nutrition/meals', icon: Utensils },
    { name: t('nutrition.hydration'), href: '/nutrition/hydration', icon: Droplet },
    { name: t('nutrition.plan'), href: '/nutrition/plan', icon: PieChart },
  ];

  // Dark mode is now handled by ThemeContext

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Initialize social features */}
      <SocialInitializer />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Background animations */}
      <div className="app-background">
        <div className="app-circle app-circle-1"></div>
        <div className="app-circle app-circle-2"></div>
        <div className="app-circle app-circle-3"></div>
      </div>

      <div className="flex h-screen bg-gray-100 dark:bg-spotify-dark-gray">
        {/* Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-spotify-black border-r border-gray-200 dark:border-spotify-lighter-gray">
              <div className="flex items-center flex-shrink-0 px-4">
                <Link to="/system-design" className="flex items-center hover:opacity-80 transition-opacity">
                  <img
                    src="/assets/logos/UKUQALA.svg"
                    alt="Ukuqala"
                    className="h-12 w-auto logo-animation"
                  />
                  <span className="ml-2 text-xl font-bold text-gray-900 dark:text-spotify-text-white">Ukuqala</span>
                </Link>
              </div>

              {/* Time Display */}
              <div className="px-4 py-4">
                <TimeDisplay locale={language} timezone={timezone} />
              </div>

              <div className="mt-5 flex-1 flex flex-col">
                <nav className="flex-1 px-2 space-y-1">
                  {navigation.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`sidebar-link group flex items-center px-2 py-2 text-sm font-medium rounded-md staggered-item transition-all duration-200 ${
                          location.pathname === item.href
                            ? 'active bg-spotify-green text-spotify-black dark:bg-spotify-green dark:text-spotify-black'
                            : 'text-gray-600 hover:bg-gray-50 dark:text-spotify-text-light dark:hover:bg-spotify-light-gray'
                        }`}
                        style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                      >
                        <Icon className="mr-3 flex-shrink-0 h-6 w-6" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* About Section */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center">
                    <Info className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Developed by</span>
                  </div>
                  <p className="text-sm font-medium dark:text-white">Ngana Noa Junior Frederic</p>
                  <div className="flex space-x-4">
                    <a
                      href="https://github.com/AlphaFrederic94"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      <Github className="h-5 w-5" />
                    </a>
                    <a
                      href="https://linkedin.com/in/noa-frederic-abel-7028122b8/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-spotify-lighter-gray p-4">
                <button
                  onClick={toggleDarkMode}
                  className="flex-1 flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 dark:text-spotify-text-light hover:bg-gray-50 dark:hover:bg-spotify-light-gray btn-hover transition-all duration-200"
                >
                  {darkMode ?
                    <Sun className="h-6 w-6 text-yellow-500 pulse-animation" /> :
                    <Moon className="h-6 w-6 text-spotify-green pulse-animation" />
                  }
                  <span className="ml-3">
                    {darkMode ? t('common.lightMode') : t('common.darkMode')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50 dark:bg-spotify-dark-gray main-content">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>

        {/* Floating Chatbot Button */}
        <FloatingChatbotButton />
      </div>
    </div>
  );
}
