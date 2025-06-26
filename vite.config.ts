import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
    open: true,
    host: 'localhost', // Use localhost instead of 0.0.0.0 for better WebSocket compatibility
    hmr: {
      overlay: false,
      timeout: 60000,
      // Explicitly configure WebSocket for better browser compatibility
      clientPort: 3000,
      host: 'localhost'
    },
    watch: {
      usePolling: false,
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/public/service-worker.js',
        '**/public/firebase-messaging-sw.js'
      ]
    },
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true
    },
    // Additional WebSocket configuration
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
      target: 'es2020' // Ensure compatibility with modern Firebase features
    }
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    chunkSizeWarningLimit: 2000 // Increase chunk size warning limit
  }
});
