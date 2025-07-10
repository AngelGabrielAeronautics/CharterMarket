'use client';

import { createTheme, alpha, ThemeOptions } from '@mui/material/styles';
import tokens from '@/styles/tokens';
import { PaletteOptions } from '@mui/material';

// Define color palette using Style-Dictionary tokens
const colors = {
  primary: {
    light: tokens.color['primary-light'].value,
    main: tokens.color.primary.value,
    dark: tokens.color['primary-dark'].value,
    contrastText: tokens.color['primary-foreground'].value,
  },
  secondary: {
    main: tokens.color.secondary.value,
    contrastText: tokens.color['secondary-foreground'].value,
  },
  background: {
    default: tokens.color.background.value,
    paper: tokens.color['background-light'].value,
  },
  card: {
    background: tokens.color.card.value,
    foreground: tokens.color['card-foreground'].value,
  },
  border: tokens.color.border.value,
};

// Enhanced typography with mobile-first responsive design
const typography = {
  fontFamily: ['var(--font-sen)', 'system-ui', 'sans-serif'].join(','),
  // Mobile-first responsive typography
  h1: {
    fontWeight: 700,
    fontSize: '1.75rem', // 28px mobile
    lineHeight: 1.2,
    letterSpacing: '-0.01562em',
    color: colors.primary.main,
    '@media (min-width:600px)': {
      fontSize: '2rem', // 32px tablet
    },
    '@media (min-width:900px)': {
      fontSize: '2.5rem', // 40px desktop
    },
  },
  h2: {
    fontWeight: 600,
    fontSize: '1.5rem', // 24px mobile
    lineHeight: 1.2,
    letterSpacing: '-0.00833em',
    color: colors.primary.main,
    '@media (min-width:600px)': {
      fontSize: '1.75rem', // 28px tablet
    },
    '@media (min-width:900px)': {
      fontSize: '2rem', // 32px desktop
    },
  },
  h3: {
    fontWeight: 600,
    fontSize: '1.25rem', // 20px mobile
    lineHeight: 1.2,
    letterSpacing: '0em',
    color: colors.primary.main,
    '@media (min-width:600px)': {
      fontSize: '1.5rem', // 24px tablet
    },
    '@media (min-width:900px)': {
      fontSize: '1.75rem', // 28px desktop
    },
  },
  h4: {
    fontWeight: 600,
    fontSize: '1.125rem', // 18px mobile
    lineHeight: 1.2,
    letterSpacing: '0.00735em',
    color: colors.primary.main,
    '@media (min-width:600px)': {
      fontSize: '1.25rem', // 20px tablet
    },
    '@media (min-width:900px)': {
      fontSize: '1.5rem', // 24px desktop
    },
  },
  h5: {
    fontWeight: 600,
    fontSize: '1rem', // 16px mobile
    lineHeight: 1.2,
    letterSpacing: '0em',
    color: colors.primary.main,
    '@media (min-width:600px)': {
      fontSize: '1.125rem', // 18px tablet+
    },
  },
  h6: {
    fontWeight: 600,
    fontSize: '0.875rem', // 14px mobile
    lineHeight: 1.2,
    letterSpacing: '0.0075em',
    color: colors.primary.main,
    '@media (min-width:600px)': {
      fontSize: '1rem', // 16px tablet+
    },
  },
  body1: { 
    fontSize: '0.875rem', // 14px mobile
    lineHeight: tokens.lineHeight.base.value, 
    letterSpacing: '0.00938em',
    '@media (min-width:600px)': {
      fontSize: '1rem', // 16px tablet+
    },
  },
  body2: {
    fontSize: '0.75rem', // 12px mobile
    lineHeight: tokens.lineHeight.base.value,
    letterSpacing: '0.01071em',
    '@media (min-width:600px)': {
      fontSize: '0.875rem', // 14px tablet+
    },
  },
  button: {
    fontWeight: 600,
    fontSize: '1rem', // 16px (prevent iOS zoom)
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
  },
  caption: { 
    fontSize: '0.75rem', // 12px
    lineHeight: 1.5, 
    letterSpacing: '0.03333em' 
  },
  subtitle1: { 
    fontSize: '0.875rem', // 14px mobile
    lineHeight: 1.5, 
    letterSpacing: '0.00938em', 
    fontWeight: 500,
    '@media (min-width:600px)': {
      fontSize: '1rem', // 16px tablet+
    },
  },
  subtitle2: { 
    fontSize: '0.75rem', // 12px mobile
    lineHeight: 1.5, 
    letterSpacing: '0.00714em', 
    fontWeight: 500,
    '@media (min-width:600px)': {
      fontSize: '0.875rem', // 14px tablet+
    },
  },
};

// Enhanced spacing function for mobile-first design
const spacing = (...factors: number[]) => {
  // Define explicit spacing values to avoid token structure issues
  const spacingMap: Record<number, string> = {
    1: '4px',
    2: '8px', 
    3: '16px',
    4: '24px',
    5: '32px',
    6: '48px',
    8: '64px',
  };
  
  return factors
    .map((f) => spacingMap[f] ?? `${f * 8}px`)
    .join(' ');
};

// Enhanced shape with mobile-friendly border radius
const shape = { borderRadius: 8 }; // Slightly larger for mobile

// Enhanced breakpoints for mobile-first design
const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  },
};

// Component overrides with mobile-first enhancements
const components: ThemeOptions['components'] = {
  MuiCssBaseline: {
    styleOverrides: {
      '*': { boxSizing: 'border-box', margin: 0, padding: 0 },
      html: {
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        height: '100%',
        width: '100%',
        // Prevent text size adjust on mobile
        WebkitTextSizeAdjust: '100%',
        MozTextSizeAdjust: '100%',
        textSizeAdjust: '100%',
      },
      body: {
        height: '100%',
        width: '100%',
        backgroundColor: colors.background.paper,
        color: colors.primary.main,
        // Mobile-specific scroll enhancements
        WebkitOverflowScrolling: 'touch',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: '8px',
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '1rem', // Prevent iOS zoom
        minHeight: '44px', // Touch target
        minWidth: '44px',
        boxShadow: 'none',
        '&:hover': { boxShadow: 'none' },
        // Enhanced mobile padding
        padding: '12px 16px',
        '@media (min-width:600px)': {
          padding: '8px 16px',
          minHeight: '40px',
        },
      },
      contained: {
        backgroundColor: '#64777c',
        color: '#fdfaf6',
        '&:hover': { 
          backgroundColor: colors.card.foreground, 
          color: colors.background.paper 
        },
      },
      outlined: {
        borderColor: colors.primary.main,
        color: colors.primary.main,
        '&:hover': {
          backgroundColor: alpha(colors.primary.main, 0.04),
          borderColor: colors.primary.light,
        },
      },
      text: {
        color: colors.primary.main,
        '&:hover': { backgroundColor: alpha(colors.primary.main, 0.04) },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: '8px',
          fontSize: '1rem', // Prevent iOS zoom
          minHeight: '48px', // Touch target
          backgroundColor: colors.card.background,
          '&:hover': { backgroundColor: '#eaeae8' },
          '& input': {
            fontSize: '1rem', // Prevent iOS zoom
            padding: '12px 14px',
            '@media (min-width:600px)': {
              padding: '8px 14px',
            },
          },
        },
      },
    },
  },
  MuiSelect: {
    styleOverrides: {
      select: {
        fontSize: '1rem', // Prevent iOS zoom
        minHeight: '48px',
        display: 'flex',
        alignItems: 'center',
        padding: '12px 14px',
        '@media (min-width:600px)': {
          minHeight: '40px',
          padding: '8px 14px',
        },
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        minHeight: '48px', // Touch target
        fontSize: '1rem',
        '@media (min-width:600px)': {
          minHeight: '40px',
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        minWidth: '44px', // Touch target
        minHeight: '44px',
        color: colors.primary.main,
        '&:hover': { backgroundColor: alpha(colors.primary.main, 0.04) },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        backgroundColor: colors.card.background,
        borderRadius: '16px',
        boxShadow: '0px 4px 8px rgba(0,0,0,0.15), 0px 2px 4px rgba(0,0,0,0.12)',
        // Mobile-specific dialog enhancements
        margin: '16px',
        '@media (max-width:600px)': {
          margin: '8px',
          borderRadius: '12px',
        },
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: { 
        borderRadius: '12px',
        padding: '12px 16px',
        '@media (min-width:600px)': {
          borderRadius: '16px',
        },
      },
      standardError: ({ theme }) => ({
        backgroundColor: '#f1f0ec',
        color: theme.palette.error.main,
      }),
      standardSuccess: { backgroundColor: '#f1f0ec', color: colors.primary.main },
      standardWarning: { backgroundColor: '#f1f0ec', color: colors.primary.main },
      standardInfo: { backgroundColor: '#f1f0ec', color: colors.primary.main },
    },
  },
  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: { 
        backgroundColor: colors.card.background, 
        boxShadow: '0px 2px 8px rgba(0,0,0,0.1)', // Mobile-optimized shadow
        '@media (min-width:600px)': {
          boxShadow: tokens.shadow.medium.value,
        },
      },
    },
  },
  MuiPopover: {
    styleOverrides: { 
      paper: { 
        backgroundColor: colors.card.background, 
        padding: spacing(1),
        // Mobile-specific popover enhancements
        '@media (max-width:600px)': {
          margin: '8px',
          borderRadius: '12px',
        },
      } 
    },
  },
  MuiPopper: { 
    styleOverrides: { 
      root: { 
        '& .MuiPaper-root': { 
          padding: spacing(1),
          '@media (max-width:600px)': {
            borderRadius: '12px',
          },
        } 
      } 
    } 
  },
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundColor: colors.card.background,
        borderRadius: '8px',
        padding: '16px',
        '@media (min-width:600px)': {
          padding: '24px',
        },
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: '16px',
        '&:last-child': {
          paddingBottom: '16px',
        },
        '@media (min-width:600px)': {
          padding: '24px',
          '&:last-child': {
            paddingBottom: '24px',
          },
        },
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        minHeight: '48px', // Touch target
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        minHeight: '48px', // Touch target
        fontSize: '1rem',
        textTransform: 'none',
        fontWeight: 500,
        '@media (min-width:600px)': {
          minHeight: '40px',
        },
      },
    },
  },
};

// Create light theme
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: colors.primary,
    secondary: colors.secondary,
    background: {
      default: tokens.color['background-light'].value,
      paper: tokens.color['background-light'].value,
    },
    text: { primary: colors.primary.main, secondary: alpha(colors.primary.main, 0.7) },
    divider: alpha(colors.primary.main, 0.12),
    common: { white: '#fff', black: '#000' },
  },
  typography,
  spacing,
  shape,
  components,
});

// Create dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: colors.primary,
    secondary: colors.secondary,
    background: { default: colors.primary.main, paper: colors.primary.light },
    text: { primary: colors.background.paper, secondary: alpha(colors.background.paper, 0.7) },
    divider: alpha(colors.background.paper, 0.12),
  },
  typography: {
    ...typography,
    h1: { ...typography.h1, color: colors.background.paper },
    h2: { ...typography.h2, color: colors.background.paper },
    h3: { ...typography.h3, color: colors.background.paper },
    h4: { ...typography.h4, color: colors.background.paper },
    h5: { ...typography.h5, color: colors.background.paper },
    h6: { ...typography.h6, color: colors.background.paper },
  },
  spacing,
  shape,
  components: {
    ...components,
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: colors.primary.main, color: colors.background.paper },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: '#f8fafc',
          color: colors.primary.main,
          '&:hover': { backgroundColor: colors.card.foreground, color: colors.background.paper },
        },
        outlined: {
          borderColor: '#f8fafc',
          color: '#f8fafc',
          '&:hover': {
            backgroundColor: alpha('#f8fafc', 0.04),
            borderColor: colors.card.foreground,
          },
        },
        text: {
          color: colors.background.paper,
          '&:hover': { backgroundColor: alpha('#f8fafc', 0.04), color: colors.background.paper },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.primary.light,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-selected': {
            color: '#fdfaf6',
          },
        }),
      },
    },
  },
});

export { lightTheme, darkTheme, colors };
export default lightTheme;

// Note: We no longer export separate light/dark themes as CSS variables toggle via the 'dark' class

// Default export is the unified theme
