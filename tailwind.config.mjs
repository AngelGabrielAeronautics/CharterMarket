import { fileURLToPath, URL } from 'node:url';

// Resolve __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = new URL('.', import.meta.url).pathname;

// Dynamically import the CJS-generated tokens
const { default: tokens } = await import('./src/styles/tokens.js');

export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: tokens.color,
      spacing: {
        ...tokens.spacing,
        // Add mobile-specific spacing
        'touch-min': '44px',
        'touch-rec': '48px',
        'touch-large': '56px',
      },
      borderRadius: tokens.borderRadius,
      fontSize: {
        ...tokens.fontSize,
        // Mobile-safe font sizes (prevent iOS zoom)
        'mobile-safe': '16px',
        'mobile-small': '14px',
      },
      boxShadow: {
        ...tokens.shadow,
        // Enhanced mobile shadows
        'mobile': '0px 2px 8px rgba(0,0,0,0.1)',
        'mobile-button': '0px 1px 4px rgba(0,0,0,0.1)',
      },
      lineHeight: tokens.lineHeight,
      // Mobile-first breakpoints (Material-UI compatible)
      screens: {
        'xs': '0px',
        'sm': '600px',
        'md': '900px',
        'lg': '1200px',
        'xl': '1536px',
      },
      // Custom mobile utilities
      minHeight: {
        'touch': '44px',
        'touch-large': '48px',
      },
      minWidth: {
        'touch': '44px',
        'touch-large': '48px',
      },
    },
  },
  plugins: [
    // Custom plugin for mobile-specific utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.touch-target': {
          'min-height': '44px',
          'min-width': '44px',
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
        },
        '.touch-target-large': {
          'min-height': '48px',
          'min-width': '48px',
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
        },
        '.mobile-safe-text': {
          'font-size': '16px',
          '-webkit-text-size-adjust': '100%',
        },
        '.mobile-scroll': {
          '-webkit-overflow-scrolling': 'touch',
          'scroll-behavior': 'smooth',
        },
        '.no-tap-highlight': {
          '-webkit-tap-highlight-color': 'transparent',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}; 