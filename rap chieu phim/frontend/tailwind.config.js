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
        cinema: {
          950: '#07090e',
          900: '#0d1117',
          850: '#131822',
          800: '#1a2232',
          700: '#263145',
          600: '#384661',
        },
        ruby: {
          500: '#ff1a2b',
          600: '#e50914',
          700: '#b80710',
          800: '#8c050c',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-red': '0 0 25px -5px rgba(229, 9, 20, 0.5)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.5)',
        'glow-blue': '0 0 25px -5px rgba(59, 130, 246, 0.5)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.5)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.25s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
