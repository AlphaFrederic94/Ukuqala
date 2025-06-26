import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';
import { SettingsProvider } from './contexts/SettingsContext';
import { UserProvider } from './contexts/UserContext';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { ThemeEnforcer } from './utils/themeEnforcer';
import { PageReloadMonitor } from './utils/pageReloadMonitor';

// Initialize theme enforcement before anything else
ThemeEnforcer.initialize();

// Initialize page reload monitoring for debugging
PageReloadMonitor.initialize();

// Expose theme debugger globally for console access
(window as any).ThemeDebug = {
  status: () => ThemeEnforcer.getStatus(),
  debug: () => ThemeEnforcer.debug(),
  initialize: () => ThemeEnforcer.initializeTheme(),
  refresh: () => ThemeEnforcer.forceRefresh(),
  resetToSystem: () => ThemeEnforcer.resetToSystem(),
  setLight: () => ThemeEnforcer.setThemeMode('light'),
  setDark: () => ThemeEnforcer.setThemeMode('dark'),
  setSystem: () => ThemeEnforcer.setThemeMode('system')
};

// Expose page reload monitor for debugging
(window as any).ReloadDebug = {
  sources: () => PageReloadMonitor.getReloadSources(),
  clear: () => PageReloadMonitor.clearReloadSources(),
  log: (source: string, details?: any) => PageReloadMonitor.logPotentialTrigger(source, details),
  safeReload: (source?: string) => PageReloadMonitor.safeReload(source),
  checkNavType: () => PageReloadMonitor.checkNavigationType()
};

console.log('🎨 Theme debugger available:');
console.log('  ThemeDebug.debug() - Full debug info');
console.log('  ThemeDebug.status() - Current status');
console.log('  ThemeDebug.setSystem() - Follow system theme');
console.log('  ThemeDebug.setLight() - Force light mode');
console.log('  ThemeDebug.setDark() - Force dark mode');
console.log('  ThemeDebug.resetToSystem() - Reset to system mode');

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <SettingsProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </SettingsProvider>
  </StrictMode>
);

// Clear browser cache if theme version has changed
const clearCacheIfNeeded = async () => {
  const currentVersion = '3.0-system-aware';
  const storedVersion = localStorage.getItem('app-version');

  if (storedVersion !== currentVersion) {
    console.log(`[Cache] Version changed from ${storedVersion} to ${currentVersion}, clearing cache...`);

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[Cache] Cleared all caches');
    }

    // Update version
    localStorage.setItem('app-version', currentVersion);

    // Force theme initialization
    ThemeEnforcer.initializeTheme();
  }
};

// Clear cache before registering service worker
clearCacheIfNeeded();

// Register service worker for PWA functionality
// In development, we can optionally disable service worker to avoid conflicts
const shouldRegisterSW = import.meta.env.PROD ||
                         !import.meta.env.VITE_DISABLE_SW_IN_DEV;

if (shouldRegisterSW) {
  serviceWorkerRegistration.register({
    onSuccess: () => console.log('Ukuqala is now available offline!'),
    onUpdate: (registration) => {
      // Initialize theme on update
      ThemeEnforcer.initializeTheme();

      // Create a UI notification to inform the user of an update
      const updateAvailable = document.createElement('div');
      updateAvailable.className = 'update-notification';
      updateAvailable.innerHTML = `
        <div class="update-inner">
          <p>A new version of Ukuqala is available with improved theme!</p>
          <button id="update-button">Update Now</button>
        </div>
      `;
      document.body.appendChild(updateAvailable);

      // Add event listener to the update button
      document.getElementById('update-button')?.addEventListener('click', () => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        // Initialize theme before reload
        ThemeEnforcer.initializeTheme();
        PageReloadMonitor.safeReload('service-worker-update');
      });
    }
  });
} else {
  console.log('[SW] Service worker registration disabled in development mode');
}