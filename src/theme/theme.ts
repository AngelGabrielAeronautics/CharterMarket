'use client';

import { createTheme } from '@mui/material/styles';
import { createThemeFromFigmaTokens } from './figma-integration';

// Create base theme
const baseTheme = createTheme({
  // Base theme configuration
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
  // Enable CSS variables for better performance
  cssVariables: true,
});

// Extend base theme with Figma tokens
const theme = createTheme(baseTheme, createThemeFromFigmaTokens(baseTheme));

export default theme; 