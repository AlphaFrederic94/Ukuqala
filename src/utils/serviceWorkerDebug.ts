// Service Worker Debug Utilities
export class ServiceWorkerDebugger {
  static async checkServiceWorkerStatus() {
    if (!('serviceWorker' in navigator)) {
      console.error('[SW Debug] Service workers are not supported in this browser');
      return {
        supported: false,
        registered: false,
        active: false,
        error: 'Service workers not supported'
      };
    }

    try {
      // Check if any service worker is registered
      const registration = await navigator.serviceWorker.getRegistration();
      
      const status = {
        supported: true,
        registered: !!registration,
        active: !!(registration?.active),
        installing: !!(registration?.installing),
        waiting: !!(registration?.waiting),
        scope: registration?.scope,
        scriptURL: registration?.active?.scriptURL,
        state: registration?.active?.state,
        error: null
      };

      console.log('[SW Debug] Service Worker Status:', status);
      return status;
    } catch (error) {
      console.error('[SW Debug] Error checking service worker status:', error);
      return {
        supported: true,
        registered: false,
        active: false,
        error: error.message
      };
    }
  }

  static async getAllRegistrations() {
    if (!('serviceWorker' in navigator)) {
      return [];
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('[SW Debug] All registrations:', registrations);
      return registrations.map(reg => ({
        scope: reg.scope,
        scriptURL: reg.active?.scriptURL,
        state: reg.active?.state,
        installing: !!reg.installing,
        waiting: !!reg.waiting
      }));
    } catch (error) {
      console.error('[SW Debug] Error getting registrations:', error);
      return [];
    }
  }

  static async unregisterAll() {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const results = await Promise.all(
        registrations.map(reg => reg.unregister())
      );
      console.log('[SW Debug] Unregistered all service workers:', results);
      return results.every(result => result);
    } catch (error) {
      console.error('[SW Debug] Error unregistering service workers:', error);
      return false;
    }
  }

  static async testServiceWorkerFile(url: string) {
    try {
      const response = await fetch(url, { cache: 'no-cache' });
      const contentType = response.headers.get('content-type');
      const isJavaScript = contentType && contentType.includes('javascript');
      
      const result = {
        url,
        status: response.status,
        statusText: response.statusText,
        contentType,
        isJavaScript,
        accessible: response.ok
      };

      console.log('[SW Debug] Service worker file test:', result);
      return result;
    } catch (error) {
      console.error('[SW Debug] Error testing service worker file:', error);
      return {
        url,
        status: 0,
        statusText: 'Network Error',
        contentType: null,
        isJavaScript: false,
        accessible: false,
        error: error.message
      };
    }
  }

  static logServiceWorkerEvents() {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW Debug] Controller changed');
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[SW Debug] Message from service worker:', event.data);
    });

    // Listen for service worker updates
    navigator.serviceWorker.ready.then(registration => {
      registration.addEventListener('updatefound', () => {
        console.log('[SW Debug] Service worker update found');
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log('[SW Debug] New service worker state:', newWorker.state);
          });
        }
      });
    });
  }

  static async runDiagnostics() {
    console.log('[SW Debug] Running service worker diagnostics...');
    
    // Check basic support
    const status = await this.checkServiceWorkerStatus();
    
    // Get all registrations
    const registrations = await this.getAllRegistrations();
    
    // Test service worker files
    const swTests = await Promise.all([
      this.testServiceWorkerFile('/service-worker.js'),
      this.testServiceWorkerFile('/firebase-messaging-sw.js')
    ]);

    const diagnostics = {
      timestamp: new Date().toISOString(),
      status,
      registrations,
      serviceWorkerFiles: swTests,
      userAgent: navigator.userAgent,
      isSecureContext: window.isSecureContext,
      location: window.location.href
    };

    console.log('[SW Debug] Diagnostics complete:', diagnostics);
    return diagnostics;
  }
}

// Auto-run diagnostics in development
if (import.meta.env.DEV) {
  ServiceWorkerDebugger.logServiceWorkerEvents();
  
  // Run diagnostics after a short delay to allow initial registration
  setTimeout(() => {
    ServiceWorkerDebugger.runDiagnostics();
  }, 2000);
}
