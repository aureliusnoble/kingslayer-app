/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        red: {
          primary: '#DC2626',
          secondary: '#991B1B',
          accent: '#FCA5A5',
          background: '#FEF2F2',
        },
        blue: {
          primary: '#2563EB',
          secondary: '#1E40AF',
          accent: '#93BBFC',
          background: '#EFF6FF',
        },
        neutral: {
          dark: '#1F2937',
          medium: '#6B7280',
          light: '#F3F4F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      animation: {
        'flip': 'flip 0.6s ease-in-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
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
        }
      }
    },
  },
  plugins: [],
}