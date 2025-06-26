/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Spotify-inspired color palette
        spotify: {
          black: '#000000',
          'dark-gray': '#121212',
          'medium-gray': '#181818',
          'light-gray': '#282828',
          'lighter-gray': '#333333',
          green: '#1db954',
          'green-hover': '#1ed760',
          'green-dark': '#1aa34a',
          'text-white': '#ffffff',
          'text-light': '#b3b3b3',
          'text-muted': '#6b7280',
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
        slideDown: 'slideDown 0.5s ease-in-out',
        slideUp: 'slideUp 0.5s ease-in-out',
        slideLeft: 'slideLeft 0.3s ease-in-out',
        slideRight: 'slideRight 0.3s ease-in-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bounce: 'bounce 1s infinite',
        spotifyScale: 'spotifyScale 0.2s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        spotifyScale: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'spotify': '0 8px 24px rgba(0,0,0,.5)',
        'spotify-hover': '0 16px 48px rgba(0,0,0,.7)',
      },
    },
  },
  plugins: [],
};