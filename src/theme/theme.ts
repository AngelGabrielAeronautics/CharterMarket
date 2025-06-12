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

// Typography settings
const typography = {
  fontFamily: ['var(--font-sen)', 'system-ui', 'sans-serif'].join(','),
  h1: {
    fontWeight: 700,
    fontSize: '2.5rem',
    lineHeight: 1.2,
    letterSpacing: '-0.01562em',
    color: colors.primary.main,
  },
  h2: {
    fontWeight: 600,
    fontSize: '2rem',
    lineHeight: 1.2,
    letterSpacing: '-0.00833em',
    color: colors.primary.main,
  },
  h3: {
    fontWeight: 600,
    fontSize: '1.75rem',
    lineHeight: 1.2,
    letterSpacing: '0em',
    color: colors.primary.main,
  },
  h4: {
    fontWeight: 600,
    fontSize: '1.5rem',
    lineHeight: 1.2,
    letterSpacing: '0.00735em',
    color: colors.primary.main,
  },
  h5: {
    fontWeight: 600,
    fontSize: '1.25rem',
    lineHeight: 1.2,
    letterSpacing: '0em',
    color: colors.primary.main,
  },
  h6: {
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: 1.2,
    letterSpacing: '0.0075em',
    color: colors.primary.main,
  },
  body1: { fontSize: '1rem', lineHeight: tokens.lineHeight.base.value, letterSpacing: '0.00938em' },
  body2: {
    fontSize: '0.875rem',
    lineHeight: tokens.lineHeight.base.value,
    letterSpacing: '0.01071em',
  },
  button: {
    fontWeight: 600,
    fontSize: '0.875rem',
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
  },
  caption: { fontSize: '0.75rem', lineHeight: 1.5, letterSpacing: '0.03333em' },
  subtitle1: { fontSize: '1rem', lineHeight: 1.5, letterSpacing: '0.00938em', fontWeight: 500 },
  subtitle2: { fontSize: '0.875rem', lineHeight: 1.5, letterSpacing: '0.00714em', fontWeight: 500 },
};

// Spacing from tokens
const spacing = (...factors: number[]) =>
  factors
    .map((f) => {
      const key = String(f) as unknown as keyof typeof tokens.spacing;
      return tokens.spacing[key]?.value ?? `${f * 8}px`;
    })
    .join(' ');

// Shape (border radius)
const shape = { borderRadius: parseInt(tokens.borderRadius.lg.value, 10) };

// Component overrides
const components: ThemeOptions['components'] = {
  MuiCssBaseline: {
    styleOverrides: {
      '*': { boxSizing: 'border-box', margin: 0, padding: 0 },
      html: {
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        height: '100%',
        width: '100%',
      },
      body: {
        height: '100%',
        width: '100%',
        backgroundColor: colors.background.paper,
        color: colors.primary.main,
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: '8px',
        textTransform: 'none',
        fontWeight: 600,
        boxShadow: 'none',
        '&:hover': { boxShadow: 'none' },
      },
      contained: {
        backgroundColor: '#64777c',
        color: '#fdfaf6',
        '&:hover': { backgroundColor: colors.card.foreground, color: colors.background.paper },
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
          backgroundColor: colors.card.background,
          '&:hover': { backgroundColor: '#eaeae8' },
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        backgroundColor: colors.card.background,
        borderRadius: '16px',
        boxShadow: '0px 4px 8px rgba(0,0,0,0.15), 0px 2px 4px rgba(0,0,0,0.12)',
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: { borderRadius: '16px' },
      standardError: ({ theme }) => ({
        backgroundColor: '#f1f0ec',
        color: theme.palette.error.main,
      }),
      standardSuccess: { backgroundColor: '#f1f0ec', color: colors.primary.main },
      standardWarning: { backgroundColor: '#f1f0ec', color: colors.primary.main },
      standardInfo: { backgroundColor: '#f1f0ec', color: colors.primary.main },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        color: colors.primary.main,
        '&:hover': { backgroundColor: alpha(colors.primary.main, 0.04) },
      },
    },
  },
  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: { backgroundColor: colors.card.background, boxShadow: tokens.shadow.medium.value },
    },
  },
  MuiPopover: {
    styleOverrides: { paper: { backgroundColor: colors.card.background, padding: spacing(1) } },
  },
  MuiPopper: { styleOverrides: { root: { '& .MuiPaper-root': { padding: spacing(1) } } } },
  MuiDrawer: { styleOverrides: { paper: { backgroundColor: colors.card.background } } },
  MuiDivider: { styleOverrides: { root: { backgroundColor: alpha(colors.primary.main, 0.12) } } },
  MuiTableCell: {
    styleOverrides: { root: { borderBottom: `1px solid ${alpha(colors.primary.main, 0.12)}` } },
  },
  MuiTableHead: { styleOverrides: { root: { backgroundColor: alpha(colors.primary.main, 0.05) } } },
  MuiChip: { styleOverrides: { root: { borderRadius: '16px' } } },
  MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
  MuiOutlinedInput: {
    styleOverrides: {
      input: {
        color: colors.card.foreground,
        '&::placeholder': { color: alpha(colors.card.foreground, 0.6) },
      },
      notchedOutline: {
        border: 'none',
      },
      root: {
        '&:hover .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: { color: colors.card.foreground, '&.Mui-focused': { color: colors.card.foreground } },
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
