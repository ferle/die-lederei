/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        burgundy: {
          50: '#fdf2f4',
          100: '#fbe6e9',
          200: '#f5d0d7',
          300: '#eeadb8',
          400: '#e37d8f',
          500: '#d65570',
          600: '#c03553',
          700: '#982231', // Main burgundy color from logo
          800: '#801f2c',
          900: '#6d1f28',
        },
      },
    },
  },
  plugins: [],
};