/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff5f2',
          100: '#ffe8e0',
          200: '#ffd0c2',
          300: '#ffaa94',
          400: '#ff7757',
          500: '#ff4b2b', // Core Brand Color (Coral Orange)
          600: '#e03214',
          700: '#bd240b',
          800: '#9d1e0c',
          900: '#811d0e',
        },
        dark: {
          50: '#a3a3a3',
          100: '#737373',
          200: '#525252',
          300: '#404040',
          400: '#262626',
          500: '#171717',
          600: '#0a0a0a',
          700: '#030303',
        }
      },
      fontFamily: {
        sans: [
          'Outfit',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        'premium': '0 4px 30px rgba(0, 0, 0, 0.02)',
        'premium-hover': '0 12px 40px rgba(0, 0, 0, 0.06)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.04)',
        'glass-hover': '0 12px 48px 0 rgba(31, 38, 135, 0.08)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
        'glass-dark-hover': '0 12px 48px 0 rgba(0, 0, 0, 0.35)',
        'glow-orange': '0 0 20px rgba(255, 75, 43, 0.15)',
        'glow-orange-lg': '0 0 35px rgba(255, 75, 43, 0.25)',
      },
      backdropBlur: {
        xs: '2px',
        xl: '20px',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        shimmer: 'shimmer 2.5s infinite linear',
        float: 'float 5s ease-in-out infinite',
        pulseSlow: 'pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        fadeIn: 'fadeIn 0.4s ease-out forwards',
      }
    },
  },
  plugins: [],
}
