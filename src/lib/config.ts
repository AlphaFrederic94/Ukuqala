export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  geminiProxy: {
    url: import.meta.env.VITE_GEMINI_PROXY_URL || 'http://localhost:3001',
  },
  googleMaps: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBjzZHbqt0sY-_McuXh1DFEGI8rHUwibNo',
  },
  app: {
    name: 'CareAI Medical App',
    version: '1.0.0',
  },
};
