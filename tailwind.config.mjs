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
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      fontSize: tokens.fontSize,
    },
  },
  plugins: [],
}; 