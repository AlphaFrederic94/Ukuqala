/**
 * Page Reload Monitor
 * Helps identify what's causing unexpected page reloads when switching tabs
 */

export class PageReloadMonitor {
  private static isInitialized = false;
  private static reloadSources: string[] = [];

  /**
   * Initialize monitoring for page reload triggers
   */
  static initialize(): void {
    if (this.isInitialized) return;

    console.log('[PageReloadMonitor] Initializing page reload monitoring...');

    // Note: Cannot override window.location.reload as it's read-only
    // Instead, we'll monitor other reload triggers and log them

    // Monitor visibility change events
    document.addEventListener('visibilitychange', () => {
      console.log('[PageReloadMonitor] Visibility changed:', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
        timestamp: new Date().toISOString()
      });
    });

    // Monitor focus/blur events
    window.addEventListener('focus', () => {
      console.log('[PageReloadMonitor] Window focused at', new Date().toISOString());
    });

    window.addEventListener('blur', () => {
      console.log('[PageReloadMonitor] Window blurred at', new Date().toISOString());
    });

    // Monitor beforeunload events (page refresh, navigation away, etc.)
    window.addEventListener('beforeunload', (event) => {
      console.log('[PageReloadMonitor] Before unload triggered:', {
        reason: 'beforeunload',
        timestamp: new Date().toISOString(),
        reloadSources: PageReloadMonitor.reloadSources,
        userAgent: navigator.userAgent
      });

      // Store reload info in sessionStorage for debugging
      try {
        sessionStorage.setItem('careai_last_unload', JSON.stringify({
          timestamp: new Date().toISOString(),
          sources: PageReloadMonitor.reloadSources,
          url: window.location.href
        }));
      } catch (e) {
        // Ignore storage errors
      }
    });

    // Monitor unload events
    window.addEventListener('unload', () => {
      console.log('[PageReloadMonitor] Unload triggered at', new Date().toISOString());
    });

    // Check if we just reloaded and log previous session info
    try {
      const lastUnload = sessionStorage.getItem('careai_last_unload');
      if (lastUnload) {
        const unloadData = JSON.parse(lastUnload);
        console.log('[PageReloadMonitor] Previous session ended:', unloadData);
        sessionStorage.removeItem('careai_last_unload');
      }
    } catch (e) {
      // Ignore parsing errors
    }

    // Monitor popstate events (back/forward navigation)
    window.addEventListener('popstate', (event) => {
      console.log('[PageReloadMonitor] Popstate event:', {
        state: event.state,
        timestamp: new Date().toISOString()
      });
    });

    // Monitor storage events
    window.addEventListener('storage', (event) => {
      console.log('[PageReloadMonitor] Storage event:', {
        key: event.key,
        oldValue: event.oldValue,
        newValue: event.newValue,
        timestamp: new Date().toISOString()
      });
    });

    // Check how the page was loaded
    this.checkNavigationType();

    this.isInitialized = true;
    console.log('[PageReloadMonitor] Page reload monitoring initialized');
  }

  /**
   * Get reload sources for debugging
   */
  static getReloadSources(): string[] {
    return [...this.reloadSources];
  }

  /**
   * Clear reload sources
   */
  static clearReloadSources(): void {
    this.reloadSources = [];
  }

  /**
   * Log a potential reload trigger
   */
  static logPotentialTrigger(source: string, details?: any): void {
    console.log(`[PageReloadMonitor] Potential reload trigger: ${source}`, details);
    this.reloadSources.push(`${source} at ${new Date().toISOString()}`);
  }

  /**
   * Safe wrapper for window.location.reload that logs the call
   */
  static safeReload(source: string = 'unknown'): void {
    console.warn(`[PageReloadMonitor] Page reload requested by: ${source}`);
    this.logPotentialTrigger(`safeReload called by ${source}`);
    window.location.reload();
  }

  /**
   * Monitor performance navigation timing to detect reload types
   */
  static checkNavigationType(): void {
    if (performance.navigation) {
      const navType = performance.navigation.type;
      const types = {
        0: 'navigate',
        1: 'reload',
        2: 'back_forward',
        255: 'reserved'
      };

      console.log('[PageReloadMonitor] Navigation type:', types[navType] || 'unknown');

      if (navType === 1) {
        this.logPotentialTrigger('Browser reload detected via performance.navigation');
      }
    }

    // Modern API
    if (performance.getEntriesByType) {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const navEntry = navEntries[0] as PerformanceNavigationTiming;
        console.log('[PageReloadMonitor] Navigation entry type:', navEntry.type);

        if (navEntry.type === 'reload') {
          this.logPotentialTrigger('Browser reload detected via PerformanceNavigationTiming');
        }
      }
    }
  }
}

// Expose globally for debugging
(window as any).PageReloadMonitor = PageReloadMonitor;
