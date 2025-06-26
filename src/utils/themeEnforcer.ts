/**
 * Theme Enforcer Utility
 * Ensures consistent Spotify dark theme across all browsers and sessions
 */

export class ThemeEnforcer {
  private static readonly THEME_VERSION = '3.0-system-aware';
  private static readonly DEFAULT_THEME = 'system';
  
  /**
   * Clear all conflicting theme data from localStorage
   */
  static clearConflictingThemeData(): void {
    const conflictingKeys = [
      'theme',
      'darkMode', 
      'ui-theme',
      'app-theme',
      'theme-preference',
      'ui-mode',
      'color-scheme',
      'appearance'
    ];
    
    let clearedKeys: string[] = [];
    
    conflictingKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        clearedKeys.push(key);
      }
    });
    
    if (clearedKeys.length > 0) {
      console.log(`[ThemeEnforcer] Cleared conflicting keys: ${clearedKeys.join(', ')}`);
    }
  }
  
  /**
   * Initialize theme based on saved preference or system default
   */
  static initializeTheme(): void {
    // Clear conflicts first
    this.clearConflictingThemeData();

    // Get saved theme or default to system
    const savedTheme = localStorage.getItem('themeMode');
    const themeToUse = savedTheme && ['light', 'dark', 'system'].includes(savedTheme)
      ? savedTheme
      : this.DEFAULT_THEME;

    // Set the theme
    localStorage.setItem('themeMode', themeToUse);
    localStorage.setItem('theme-version', this.THEME_VERSION);

    // Apply theme based on preference
    this.applyTheme(themeToUse);

    console.log(`[ThemeEnforcer] Initialized theme: ${themeToUse} v${this.THEME_VERSION}`);
  }

  /**
   * Apply theme to document
   */
  static applyTheme(themeMode: string): void {
    document.documentElement.setAttribute('data-theme-version', this.THEME_VERSION);
    document.documentElement.classList.remove('light', 'dark', 'system');

    let isDark = false;
    if (themeMode === 'dark') {
      isDark = true;
    } else if (themeMode === 'light') {
      isDark = false;
    } else {
      // system mode - check system preference
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#121212';
      document.body.style.color = '#ffffff';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#000000';
    }

    // Force a style recalculation
    document.documentElement.offsetHeight;
  }
  
  /**
   * Check if theme needs to be reapplied
   */
  static needsReapplication(): boolean {
    const currentVersion = localStorage.getItem('theme-version');
    return currentVersion !== this.THEME_VERSION;
  }
  
  /**
   * Initialize theme system on app start
   */
  static initialize(): void {
    console.log('[ThemeEnforcer] Initializing theme system...');

    // Initialize theme based on saved preference or system default
    this.initializeTheme();

    // Set up a periodic check to ensure theme version is current (less frequent to avoid performance issues)
    setInterval(() => {
      if (this.needsReapplication()) {
        console.log('[ThemeEnforcer] Theme version outdated, reapplying...');
        const currentTheme = localStorage.getItem('themeMode') || this.DEFAULT_THEME;
        this.applyTheme(currentTheme);
      }
    }, 30000); // Check every 30 seconds (reduced frequency)

    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'themeMode' && e.newValue) {
        console.log('[ThemeEnforcer] Theme changed in another tab, applying...');
        this.applyTheme(e.newValue);
      }
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      const currentTheme = localStorage.getItem('themeMode');
      if (currentTheme === 'system') {
        console.log('[ThemeEnforcer] System theme changed, reapplying...');
        this.applyTheme('system');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
    }

    console.log('[ThemeEnforcer] Theme system initialized');
  }
  
  /**
   * Get current theme status for debugging
   */
  static getStatus(): object {
    return {
      themeMode: localStorage.getItem('themeMode'),
      themeVersion: localStorage.getItem('theme-version'),
      documentClasses: Array.from(document.documentElement.classList),
      documentAttributes: Array.from(document.documentElement.attributes).map(attr => ({
        name: attr.name,
        value: attr.value
      })),
      bodyBackground: document.body.style.backgroundColor,
      bodyColor: document.body.style.color,
      computedBodyStyle: window.getComputedStyle(document.body).backgroundColor,
      needsReapplication: this.needsReapplication(),
      allLocalStorageKeys: Object.keys(localStorage).filter(key =>
        key.includes('theme') || key.includes('dark') || key.includes('mode')
      ).map(key => ({ key, value: localStorage.getItem(key) }))
    };
  }

  /**
   * Debug theme issues - call from console
   */
  static debug(): void {
    console.group('🎨 Theme Debug Information');
    console.log('Current Status:', this.getStatus());
    console.log('CSS Variables:', {
      spotifyBlack: getComputedStyle(document.documentElement).getPropertyValue('--spotify-black'),
      spotifyDarkGray: getComputedStyle(document.documentElement).getPropertyValue('--spotify-dark-gray'),
      spotifyGreen: getComputedStyle(document.documentElement).getPropertyValue('--spotify-green')
    });
    console.log('Applied Stylesheets:', Array.from(document.styleSheets).map(sheet => ({
      href: sheet.href,
      disabled: sheet.disabled,
      rules: sheet.cssRules?.length || 'N/A'
    })));
    console.groupEnd();
  }

  /**
   * Force theme refresh - call from console if needed
   */
  static forceRefresh(): void {
    console.log('🔄 Forcing theme refresh...');
    const currentTheme = localStorage.getItem('themeMode') || this.DEFAULT_THEME;
    this.applyTheme(currentTheme);
    setTimeout(() => {
      // Use PageReloadMonitor's safe reload if available
      if ((window as any).ReloadDebug?.safeReload) {
        (window as any).ReloadDebug.safeReload('theme-enforcer-refresh');
      } else {
        window.location.reload();
      }
    }, 1000);
  }

  /**
   * Reset theme to system mode - useful for debugging
   */
  static resetToSystem(): void {
    console.log('🔄 Resetting theme to system mode...');
    localStorage.setItem('themeMode', 'system');
    localStorage.setItem('theme-version', this.THEME_VERSION);
    this.applyTheme('system');
    console.log('✅ Theme reset to system mode');
  }

  /**
   * Set theme mode explicitly
   */
  static setThemeMode(mode: 'light' | 'dark' | 'system'): void {
    console.log(`🎨 Setting theme mode to: ${mode}`);
    localStorage.setItem('themeMode', mode);
    localStorage.setItem('theme-version', this.THEME_VERSION);
    this.applyTheme(mode);
    console.log(`✅ Theme set to ${mode} mode`);
  }
}
