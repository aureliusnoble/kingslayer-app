/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Medieval Team Colors
        red: {
          primary: '#B91C1C',        // Deep crimson
          secondary: '#7F1D1D',      // Dark crimson
          accent: '#DC2626',         // Bright crimson
          background: '#1F1315',     // Almost black with red undertone
          highlight: '#FCA5A5',      // Light crimson highlights
        },
        blue: {
          primary: '#1E40AF',        // Deep royal blue
          secondary: '#1E3A8A',      // Dark royal blue
          accent: '#2563EB',         // Bright royal blue
          background: '#0F1419',     // Almost black with blue undertone
          highlight: '#93C5FD',      // Light blue highlights
        },
        // Medieval Atmosphere
        medieval: {
          stone: {
            dark: '#1C1917',         // Dark castle stone
            medium: '#44403C',       // Castle walls
            light: '#78716C',        // Light stone accents
          },
          metal: {
            gold: '#D97706',         // Royal gold
            copper: '#C2410C',       // Copper details
          },
          flame: {
            orange: '#EA580C',       // Torch flame
            yellow: '#FBBF24',       // Flame highlights
          },
          parchment: '#FEF3C7',      // Scroll/text color
        },
        // Dark UI System
        surface: {
          dark: '#0A0A0A',           // Primary background
          medium: '#171717',         // Cards/panels
          light: '#262626',          // Interactive elements
        },
        // Legacy neutral colors (keeping for compatibility)
        neutral: {
          dark: '#1F2937',
          medium: '#6B7280',
          light: '#F3F4F6',
        }
      },
      fontFamily: {
        'display': ['Cinzel', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'flip': 'flip 0.6s ease-in-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
        'card-flip': 'medievalCardFlip 0.6s ease-in-out',
        'crown-pulse': 'crownPulse 2s ease-in-out infinite',
        'ember-float': 'floatingEmber 4s linear infinite',
        'button-press': 'buttonPress 0.1s ease-out',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        medievalCardFlip: {
          '0%': { transform: 'rotateY(0deg) scale(1)' },
          '50%': { transform: 'rotateY(90deg) scale(1.05)' },
          '100%': { transform: 'rotateY(0deg) scale(1)' },
        },
        crownPulse: {
          '0%, 100%': { 
            transform: 'scale(1)', 
            filter: 'drop-shadow(0 0 10px rgba(217, 119, 6, 0.4))'
          },
          '50%': { 
            transform: 'scale(1.05)', 
            filter: 'drop-shadow(0 0 20px rgba(217, 119, 6, 0.6))'
          },
        },
        floatingEmber: {
          '0%': { 
            transform: 'translateY(100vh) translateX(0) scale(0)',
            opacity: '0'
          },
          '10%': { 
            opacity: '1',
            transform: 'translateY(90vh) translateX(5px) scale(1)'
          },
          '90%': { 
            opacity: '1',
            transform: 'translateY(10vh) translateX(20px) scale(1)'
          },
          '100%': { 
            transform: 'translateY(-10px) translateX(25px) scale(0)',
            opacity: '0'
          }
        },
        buttonPress: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' },
        }
      },
      boxShadow: {
        'medieval': '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        'medieval-hover': '0 6px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        'medieval-pressed': '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      backdropBlur: {
        'medieval': '8px',
      }
    },
  },
  plugins: [],
}