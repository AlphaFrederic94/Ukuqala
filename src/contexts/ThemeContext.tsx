import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  darkMode: boolean;
  themeMode: ThemeMode;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  themeMode: 'system',
  toggleDarkMode: () => {},
  setDarkMode: () => {},
  setThemeMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize theme based on system preference or saved preference
  const initializeTheme = (): ThemeMode => {
    if (typeof window !== 'undefined') {
      // Clear any old conflicting theme data
      const keysToRemove = ['theme', 'darkMode', 'ui-theme', 'app-theme'];
      keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`[Theme] Cleared conflicting localStorage key: ${key}`);
        }
      });

      // Get saved theme preference or default to system
      const savedTheme = localStorage.getItem('themeMode') as ThemeMode;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        console.log(`[Theme] Using saved theme preference: ${savedTheme}`);
        return savedTheme;
      }

      // Default to system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme: ThemeMode = 'system';
      localStorage.setItem('themeMode', defaultTheme);
      console.log(`[Theme] Defaulting to system theme (system prefers: ${systemPrefersDark ? 'dark' : 'light'})`);
      return defaultTheme;
    }
    return 'system';
  };

  // Initialize theme mode from localStorage or system preference
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return initializeTheme();
  });

  // Calculate dark mode based on theme mode and system preference
  const [darkMode, setDarkModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const mode = localStorage.getItem('themeMode') as ThemeMode || 'system';
      console.log(`[Theme] Initializing with mode: ${mode}`);

      if (mode === 'dark') return true;
      if (mode === 'light') return false;
      // For system mode, check system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false; // Default to light mode when window is not available
  });

  // Toggle dark mode (switches between light and dark, not system)
  const toggleDarkMode = () => {
    const newMode: ThemeMode = darkMode ? 'light' : 'dark';
    setThemeModeState(newMode);
  };

  // Set dark mode explicitly (switches to light or dark mode)
  const setDarkMode = (value: boolean) => {
    const newMode: ThemeMode = value ? 'dark' : 'light';
    setThemeModeState(newMode);
  };

  // Set theme mode explicitly
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  // Update dark mode when theme mode changes
  useEffect(() => {
    let newDarkMode = false;

    if (themeMode === 'dark') {
      newDarkMode = true;
    } else if (themeMode === 'light') {
      newDarkMode = false;
    } else {
      // system mode
      newDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setDarkModeState(newDarkMode);
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  // Apply dark mode to document when it changes
  useEffect(() => {
    console.log(`[Theme] Applying theme mode: ${themeMode}, dark mode: ${darkMode}`);

    // Add transition class to enable smooth transitions
    document.documentElement.classList.add('dark-mode-transition');

    // Remove any conflicting classes
    document.documentElement.classList.remove('light', 'system');

    if (darkMode) {
      document.documentElement.classList.add('dark');
      // Apply dark theme background
      document.body.style.backgroundColor = '#121212'; // Dark gray
      console.log('[Theme] Applied dark mode classes');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#ffffff';
      console.log('[Theme] Applied light mode classes');
    }

    // Force a repaint to ensure styles are applied
    document.documentElement.offsetHeight;
  }, [darkMode, themeMode]);

  // Add transition class on mount and ensure proper initialization
  useEffect(() => {
    console.log('[Theme] ThemeProvider mounted, initializing...');

    // Ensure proper initialization
    document.documentElement.classList.add('dark-mode-transition');

    // Apply initial theme based on current mode
    const currentMode = localStorage.getItem('themeMode') || 'system';
    console.log(`[Theme] Initial theme mode on mount: ${currentMode}`);

    // Add a version marker to help with debugging
    localStorage.setItem('theme-version', '3.0-system-aware');
    console.log('[Theme] Set theme version marker');

    return () => {
      document.documentElement.classList.remove('dark-mode-transition');
    };
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      console.log(`[Theme] System preference changed to: ${e.matches ? 'dark' : 'light'}`);
      if (themeMode === 'system') {
        console.log('[Theme] Updating app theme to match system preference');
        setDarkModeState(e.matches);
      } else {
        console.log(`[Theme] App is in ${themeMode} mode, not following system change`);
      }
    };

    // Log current system preference
    console.log(`[Theme] Current system preference: ${mediaQuery.matches ? 'dark' : 'light'}`);
    console.log(`[Theme] App theme mode: ${themeMode}`);

    // Add event listener with newer API if available
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, themeMode, toggleDarkMode, setDarkMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
