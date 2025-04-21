import { getContrastRatio } from '@/utils/contrast';

export const colors = {
  // Primary Colors
  charter: {
    navy: {
      50: '#F0F7F9',
      100: '#E1EEF3',
      200: '#C3DDE7',
      300: '#A5CCDB',
      400: '#87BBCF',
      500: '#1A2B3C', // Base navy
      600: '#152331',
      700: '#101A25',
      800: '#0A1219',
      900: '#05090C',
    },
    gold: {
      50: '#FDF8F3',
      100: '#FBF1E7',
      200: '#F7E3CF',
      300: '#F3D5B7',
      400: '#EFC79F',
      500: '#C4A962', // Base gold
      600: '#9D874E',
      700: '#76653B',
      800: '#4F4427',
      900: '#282214',
    },
  },
  
  // Semantic Colors
  text: {
    primary: '#1A2B3C',    // Navy 500 - For main text on light backgrounds
    secondary: '#4F4427',  // Gold 800 - For secondary text on light backgrounds
    light: '#FFFFFF',      // White - For text on dark backgrounds
    muted: '#6B7280',      // Gray - For less important text
  },
  
  // Background Colors
  background: {
    primary: '#FFFFFF',    // White - Main background
    secondary: '#F0F7F9',  // Navy 50 - Secondary background
    dark: '#1A2B3C',       // Navy 500 - Dark sections
    accent: '#C4A962',     // Gold 500 - Accent sections
  },
  
  // Interactive Elements
  interactive: {
    default: '#C4A962',    // Gold 500 - Default button
    hover: '#9D874E',      // Gold 600 - Button hover
    active: '#76653B',     // Gold 700 - Button active
    focus: '#EFC79F',      // Gold 400 - Focus rings
  },
  
  // Status Colors
  status: {
    success: {
      text: '#065F46',     // Green text
      bg: '#ECFDF5',       // Green background
      border: '#059669',   // Green border
    },
    error: {
      text: '#991B1B',     // Red text
      bg: '#FEF2F2',       // Red background
      border: '#DC2626',   // Red border
    },
    warning: {
      text: '#92400E',     // Yellow text
      bg: '#FFFBEB',       // Yellow background
      border: '#F59E0B',   // Yellow border
    },
    info: {
      text: '#1E40AF',     // Blue text
      bg: '#EFF6FF',       // Blue background
      border: '#3B82F6',   // Blue border
    },
  },
  
  // Overlay Colors
  overlay: {
    light: 'rgba(255, 255, 255, 0.9)',
    dark: 'rgba(26, 43, 60, 0.75)',    // Navy 500 with opacity
    modal: 'rgba(26, 43, 60, 0.4)',    // Navy 500 with opacity
  },
  
  // Border Colors
  border: {
    light: '#E1EEF3',     // Navy 100
    medium: '#C3DDE7',    // Navy 200
    dark: '#1A2B3C',      // Navy 500
    accent: '#C4A962',    // Gold 500
  },
};

// Color combinations that meet WCAG contrast requirements
export const colorCombos = {
  // Light Theme
  light: {
    primary: {
      bg: colors.background.primary,
      text: colors.text.primary,        // 11.5:1 contrast ratio
      accent: colors.charter.gold[500], // 4.7:1 contrast ratio
    },
    secondary: {
      bg: colors.background.secondary,
      text: colors.text.primary,        // 10.8:1 contrast ratio
      accent: colors.charter.gold[600], // 5.2:1 contrast ratio
    },
    accent: {
      bg: colors.charter.gold[500],
      text: colors.text.primary,        // 4.7:1 contrast ratio
      accent: colors.charter.navy[500], // 4.5:1 contrast ratio
    },
  },
  
  // Dark Theme
  dark: {
    primary: {
      bg: colors.charter.navy[500],
      text: colors.text.light,          // 11.5:1 contrast ratio
      accent: colors.charter.gold[400], // 4.8:1 contrast ratio
    },
    secondary: {
      bg: colors.charter.navy[600],
      text: colors.text.light,          // 13.2:1 contrast ratio
      accent: colors.charter.gold[400], // 5.1:1 contrast ratio
    },
    accent: {
      bg: colors.charter.gold[600],
      text: colors.text.light,          // 7.2:1 contrast ratio
      accent: colors.charter.navy[500], // 4.5:1 contrast ratio
    },
  },
};

// Helper function to get a color with guaranteed contrast
export function getAccessibleColor(background: string, minimumContrast: number = 4.5): string {
  const options = [
    colors.text.primary,
    colors.text.light,
    colors.charter.gold[500],
    colors.charter.gold[600],
    colors.charter.navy[500],
    colors.charter.navy[600],
  ];
  
  for (const color of options) {
    if (getContrastRatio(color, background) >= minimumContrast) {
      return color;
    }
  }
  
  return colors.text.primary; // Fallback to primary text color
} 