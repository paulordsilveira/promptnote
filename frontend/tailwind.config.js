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
        black: '#000000',
        white: '#FFFFFF',
        purple: {
          DEFAULT: '#6A00AD',
          light: '#A076FB',
        },
        gold: {
          DEFAULT: '#FFD700',
          dark: '#68660B'
        },
        background: {
          light: '#FFFFFF',
          dark: '#000000',
        },
        surface: {
          light: '#F5F5F5',
          dark: '#1A1A1A',
        },
      },
    },
  },
  plugins: [],
} 