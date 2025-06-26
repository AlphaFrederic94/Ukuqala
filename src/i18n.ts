import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
// Import Backend lazily to avoid issues if the package is not installed
let Backend: any;
try {
  Backend = require('i18next-http-backend').default;
} catch (e) {
  console.warn('i18next-http-backend not available, using only local translations');
  Backend = null;
}

// Import translations
import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';
import translationFR from './locales/fr/translation.json';

// Resources object with translations
const resources = {
  en: {
    translation: translationEN
  },
  es: {
    translation: translationES
  },
  fr: {
    translation: translationFR
  }
};

// Initialize i18n with available plugins
const i18nInstance = i18n;

// Add backend if available
if (Backend) {
  i18nInstance.use(Backend);
}

// Add language detector and React integration
i18nInstance
  .use(LanguageDetector)
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Detection options
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'language',
      caches: ['localStorage'],
    },

    // React options
    react: {
      useSuspense: true,
    },
  });

export default i18nInstance;
