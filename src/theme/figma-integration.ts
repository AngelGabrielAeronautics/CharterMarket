import { Theme } from '@mui/material/styles';
import tokens from '../styles/tokens';
import kebabCase from 'lodash.kebabcase';

const sanitizeClass = (className: string) => className.toLowerCase().replace(/[^a-z0-9]/gi, '');

export function createThemeFromFigmaTokens(baseTheme: Theme): Partial<Theme> {
  return {
    palette: {
      ...baseTheme.palette,
      ...Object.fromEntries(
        Object.entries(tokens.color || {}).map(([key, value]) => [
          kebabCase(key),
          value
        ])
      )
    },
    typography: {
      ...baseTheme.typography,
      ...Object.fromEntries(
        Object.entries(tokens.font || {}).map(([key, value]) => [
          sanitizeClass(key),
          {
            fontSize: `${value.fontSize / 16}rem`,
            letterSpacing: `${value.letterSpacing / value.fontSize}em`,
            lineHeight: value.lineHeight / value.fontSize,
            fontFamily: value.fontFamily,
            fontWeight: value.fontWeight,
            textTransform: value.textCase === 'uppercase' ? 'uppercase' : undefined
          }
        ])
      )
    },
    spacing: (factor: number) => {
      const baseSpacing = tokens.spacing?.base || 8;
      return `${(baseSpacing * factor) / 16}rem`;
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius?.button || '4px',
            textTransform: 'uppercase',
            fontWeight: 600
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            borderRadius: tokens.borderRadius?.input || '4px'
          }
        }
      }
    }
  };
} 