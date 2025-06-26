import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/highContrast.css';

export type ContrastMode = 'normal' | 'high' | 'custom';

interface SettingsContextType {
  language: string;
  timezone: string;
  contrastMode: ContrastMode;
  fontSize: number;
  setLanguage: (lang: string) => void;
  setTimezone: (tz: string) => void;
  setContrastMode: (mode: ContrastMode) => void;
  setFontSize: (size: number) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  language: 'en',
  timezone: 'UTC',
  contrastMode: 'normal',
  fontSize: 16,
  setLanguage: () => {},
  setTimezone: () => {},
  setContrastMode: () => {},
  setFontSize: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(localStorage.getItem('language') || 'en');
  const [timezone, setTimezoneState] = useState(localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [contrastMode, setContrastModeState] = useState<ContrastMode>(
    (localStorage.getItem('contrastMode') as ContrastMode) || 'normal'
  );
  const [fontSize, setFontSizeState] = useState(
    parseInt(localStorage.getItem('fontSize') || '16', 10)
  );

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const setTimezone = (tz: string) => {
    setTimezoneState(tz);
    localStorage.setItem('timezone', tz);
  };

  const setContrastMode = (mode: ContrastMode) => {
    setContrastModeState(mode);
    localStorage.setItem('contrastMode', mode);

    // Apply contrast mode to the document
    document.body.classList.remove('high-contrast');
    if (mode === 'high') {
      document.body.classList.add('high-contrast');
    }
  };

  const setFontSize = (size: number) => {
    setFontSizeState(size);
    localStorage.setItem('fontSize', size.toString());
    document.documentElement.style.fontSize = `${size}px`;
  };

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  // Apply saved contrast mode on initial load
  useEffect(() => {
    if (contrastMode === 'high') {
      document.body.classList.add('high-contrast');
    }
  }, [contrastMode]);

  // Apply saved font size on initial load
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  return (
    <SettingsContext.Provider
      value={{
        language,
        timezone,
        contrastMode,
        fontSize,
        setLanguage,
        setTimezone,
        setContrastMode,
        setFontSize
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);