import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)'],
        playfair: ['var(--font-playfair)'],
        montserrat: ['var(--font-montserrat)'],
        sen: ['var(--font-sen)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sen)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Display text
        'display-2xl': ['4.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-xl': ['3.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-lg': ['3rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'display-sm': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-xs': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        // Body text
        'body-xl': ['1.25rem', { lineHeight: '1.6' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body-md': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'body-xs': ['0.75rem', { lineHeight: '1.5' }],
      },
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      colors: {
        'charter-navy': {
          50: '#F0F7F9',
          100: '#E1EEF3',
          200: '#C3DDE7',
          300: '#A5CCDB',
          400: '#87BBCF',
          500: '#69AAC3',
          600: '#4B99B7',
          700: '#2D88AB',
          800: '#0F779F',
          900: '#0B3746',
          950: '#061E26',
        },
        'charter-gold': {
          50: '#FDF8F3',
          100: '#FBF1E7',
          200: '#F7E3CF',
          300: '#F3D5B7',
          400: '#EFC79F',
          500: '#EBB987',
          600: '#E7AB6F',
          700: '#E39D57',
          800: '#DF8F3F',
          900: '#DB8127',
        },
        text: {
          light: {
            primary: '#0B3746',
            secondary: '#0B3746',
            muted: '#355059',
            accent: '#DB8127',
            link: '#0F779F',
          },
          dark: {
            primary: '#F9EFE4',
            secondary: '#EFC79F',
            muted: '#F3D5B7',
            accent: '#EBB987',
            link: '#F7E3CF',
          },
        },
        border: {
          light: '#E1EEF3',
          'light-hover': '#C3DDE7',
          dark: '#2D88AB',
          'dark-hover': '#4B99B7',
        },
        focus: {
          light: '#EBB987',
          dark: '#E7AB6F',
        },
        background: {
          'light-primary': '#FFFFFF',
          'light-secondary': '#F9FAFB',
          'light-muted': '#F3F4F6',
          'light-accent': '#FEF3C7',
          'dark-primary': '#0B3746',
          'dark-secondary': '#0F779F',
          'dark-muted': '#2D88AB',
          'dark-accent': '#DB8127',
        },
        interactive: {
          light: {
            primary: '#355059',
            secondary: '#485b61',
            muted: '#2D88AB',
            accent: '#DB8127',
          },
          dark: {
            primary: '#FFFFFF',
            secondary: '#F9FAFB',
            muted: '#F3F4F6',
            accent: '#FEF3C7',
          },
        },
        feedback: {
          'success-light': '#BBF7D0',
          'success-dark': '#22C55E',
          'warning-light': '#FEF08A',
          'warning-dark': '#EAB308',
          'error-light': '#FECACA',
          'error-dark': '#EF4444',
          'info-light': '#BFDBFE',
          'info-dark': '#3B82F6',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config; 