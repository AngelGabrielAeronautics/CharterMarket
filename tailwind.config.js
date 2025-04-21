/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0F7F9',
          100: '#E1EEF2',
          200: '#C3DDE5',
          300: '#A5CCD8',
          400: '#87BBCB',
          500: '#69AABE',
          600: '#4B99B1',
          700: '#2D88A4',
          800: '#0F7797',
          900: '#0F3744',
        },
        cream: {
          50: '#FFFFFF',
          100: '#FAF6F0',
          200: '#F5EDE1',
          300: '#F0E4D2',
          400: '#EBDBC3',
          500: '#E6D2B4',
          600: '#E1C9A5',
          700: '#DCC096',
          800: '#D7B787',
          900: '#D2AE78',
        },
      },
      backgroundColor: {
        'dark-primary': '#0F3744',
        'dark-secondary': '#0A2530',
        'dark-accent': '#164454',
      },
      textColor: {
        'dark-primary': '#FAF6F0',
        'dark-secondary': '#E1C9A5',
        'dark-muted': '#87BBCB',
      },
      borderColor: {
        'dark-border': '#164454',
      },
      ringOffsetColor: {
        'dark-primary': '#0F3744',
      },
    },
  },
  plugins: [],
} 