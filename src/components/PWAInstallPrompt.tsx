import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PWAInstallPrompt: React.FC = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Only show the prompt if:
    // 1. Not already installed
    // 2. Not shown in the last 30 days
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    const lastPromptDate = localStorage.getItem('pwaPromptLastShown');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const shouldShowPrompt = 
      !isInstalled && 
      (!lastPromptDate || new Date(lastPromptDate) < thirtyDaysAgo);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      if (shouldShowPrompt) {
        // Wait 5 seconds before showing the prompt
        setTimeout(() => {
          setShowPrompt(true);
          localStorage.setItem('pwaPromptLastShown', new Date().toISOString());
        }, 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If on iOS and should show prompt, show iOS-specific instructions
    if (isIOSDevice && shouldShowPrompt) {
      setTimeout(() => {
        setShowPrompt(true);
        localStorage.setItem('pwaPromptLastShown', new Date().toISOString());
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, so clear it
    setDeferredPrompt(null);
    setShowPrompt(false);

    // Log the outcome
    console.log(`User ${outcome} the install prompt`);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 z-50"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('pwa.installTitle')}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {isIOS 
                ? t('pwa.installPromptIOS')
                : t('pwa.installPrompt')}
            </p>
            
            {isIOS ? (
              <div className="mt-3 text-sm">
                <ol className="list-decimal pl-5 space-y-1 text-gray-600 dark:text-gray-300">
                  <li>{t('pwa.iosStep1')}</li>
                  <li>{t('pwa.iosStep2')}</li>
                  <li>{t('pwa.iosStep3')}</li>
                </ol>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('pwa.installButton')}
              </button>
            )}
          </div>
          <button
            onClick={dismissPrompt}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
