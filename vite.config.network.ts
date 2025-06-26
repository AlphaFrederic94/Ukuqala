import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Alternative configuration for network access
export default defineConfig({
  plugins: [react()],
  define: {
    // Fix process.env issues in service worker
    'process.env': {}
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    open: false, // Don't auto-open when using network mode
    host: '0.0.0.0', // Allow network access
    hmr: {
      overlay: false,
      timeout: 60000,
      // Use port for network access
      port: 3001,
      clientPort: 3001
    },
    watch: {
      usePolling: true, // Enable polling for network file systems
      interval: 1000,
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/public/service-worker.js',
        '**/public/firebase-messaging-sw.js'
      ]
    },
    cors: {
      origin: true, // Allow all origins in network mode
      credentials: true
    },
    ws: true
  },
  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'firebase/messaging',
      'firebase/analytics',
      'firebase/performance',
      'firebase/remote-config',
      'firebase/functions'
    ],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    chunkSizeWarningLimit: 2000
  }
});
