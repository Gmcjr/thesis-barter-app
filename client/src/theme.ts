import { createTheme, type Theme } from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark';

export const radius = {
  sm: '6px', md: '10px', lg: '16px', xl: '22px', pill: '9999px',
};

// Design tokens - single source of truth for color/font values in app
// Update values here and not at call sites
const clay = {
  100: '#f6e3d8', 200: '#eec7ab', 300: '#e3a47e', 400: '#d1815a', 500: '#c0603a', 600: '#a34f30', 700: '#7d3b23',
};
const sage = {
  100: '#e2ead7', 300: '#a8c08e', 400: '#87a86c', 500: '#6e8f57', 600: '#56713f', 700: '#405431',
};
const ochre = {
  100: '#faf0d6', 300: '#eec574', 400: '#e0a83e', 500: '#c68f2b', 600: '#a3721f',
};
const brick = {
  100: '#f7e2dd', 400: '#cf6f5f', 500: '#b84a3a', 600: '#963a2c',
};
const dusty = {
  100: '#e6edf1', 400: '#84a3b6', 500: '#5c7c93', 600: '#456177',
};
const ink = {
  100: '#e7ded4', 200: '#d3c6b8', 300: '#b4a69b', 500: '#74655c', 700: '#4a3f38', 900: '#2b2420',
};
const cream = { 50: '#fdfaf5', 100: '#f6eee1' };

const fonts = {
  display: '"Young Serif", serif',
  body: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
};

// Adds semantic palette slots MUI doesn't have by default
// So components can read theme.palette.accent / .surface / .border / .link instead of hex
declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
    surface: { sunken: string; overlay: string };
    border: { subtle: string; default: string; strong: string };
    link: { main: string; hover: string };
  }
  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
    surface?: { sunken: string; overlay: string };
    border?: { subtle: string; default: string; strong: string };
    link?: { main: string; hover: string };
  }
}

// A theme is a self-contained set of every palette value
// A new theme (light/dark/custom) can fill in this shape with its own values
export interface ThemeTokens {
    mode: ThemeMode;
    background: { default: string; paper: string };
    primary: { main: string; light: string; dark: string };
    secondary: { main: string; light: string; dark: string };
    accent: { main: string; light: string; dark: string };
    error: { main: string; light: string; dark: string };
    warning: { main: string; light: string };
    success: { main: string; light: string };
    info: { main: string; light: string };
    divider: string;
    text: { primary: string; secondary: string };
    surface: { sunken: string; overlay: string };
    border: { subtle: string; default: string; strong: string };
    link: { main: string; hover: string };
  }

export const lightTokens: ThemeTokens = {
  mode: 'light',
  background: { default: cream[50], paper: '#ffffff' },
  primary: { main: clay[500], light: clay[100], dark: clay[600] },
  secondary: { main: sage[500], light: sage[100], dark: sage[600] },
  accent: { main: ochre[400], light: ochre[100], dark: ochre[500] },
  error: { main: brick[500], light: brick[100], dark: brick[600] },
  warning: { main: ochre[600], light: ochre[100] },
  success: { main: sage[600], light: sage[100] },
  info: { main: dusty[500], light: dusty[100] },
  divider: ink[100],
  text: { primary: ink[900], secondary: ink[700] },
  surface: { sunken: cream[100], overlay: 'rgba(43,36,32,0.5)' },
  border: { subtle: ink[100], default: ink[200], strong: ink[300] },
  link: { main: clay[600], hover: clay[700] },
};

export const darkTokens: ThemeTokens = {
  mode: 'dark',
  background: { default: '#060505', paper: '#1a1816' },
  primary: { main: clay[400], light: clay[100], dark: clay[600] },
  secondary: { main: sage[400], light: sage[100], dark: sage[600] },
  accent: { main: ochre[400], light: ochre[100], dark: ochre[500] },
  error: { main: brick[400], light: brick[100], dark: brick[600] },
  warning: { main: ochre[600], light: ochre[100] },
  success: { main: sage[400], light: sage[100] },
  info: { main: dusty[500], light: dusty[100] },
  divider: ink[700],
  text: { primary: '#f5f1eb', secondary: ink[200] },
  surface: { sunken: '#0f0d0c', overlay: 'rgba(3, 3, 3, 0.6)' },
  border: { subtle: ink[700], default: ink[500], strong: ink[300] },
  link: { main: clay[300], hover: clay[200] },
};

export function buildTheme(tokens: ThemeTokens): Theme {
  return createTheme({
    palette: {
      mode: tokens.mode,
      background: tokens.background,
      primary: tokens.primary,
      secondary: tokens.secondary,
      accent: tokens.accent,
      error: tokens.error,
      warning: tokens.warning,
      success: tokens.success,
      info: tokens.info,
      divider: tokens.divider,
      text: tokens.text,
      surface: tokens.surface,
      border: tokens.border,
      link: tokens.link,
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: fonts.body,
      h1: {
        fontFamily: fonts.display, fontWeight: 600, fontSize: '3.4rem', lineHeight: 1.08,
      },
      h2: {
        fontFamily: fonts.display, fontWeight: 600, fontSize: '2.5rem', lineHeight: 1.12,
      },
      h3: {
        fontFamily: fonts.display, fontWeight: 600, fontSize: '1.9rem', lineHeight: 1.18,
      },
      h4: {
        fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.28,
      },
      h5: {
        fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.32,
      },
      h6: {
        fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.35,
      },
      subtitle1: {
        fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.35,
      },
      subtitle2: {
        fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.3, letterSpacing: '0.04em',
      },
      body1: {
        fontWeight: 400, fontSize: '1.125rem', lineHeight: 1.6,
      },
      body2: {
        fontWeight: 400, fontSize: '1rem', lineHeight: 1.55,
      },
      caption: {
        fontWeight: 400, fontSize: '0.75rem', lineHeight: 1.4, letterSpacing: '0.02em',
      },
      button: {
        fontWeight: 700, fontSize: '1rem', lineHeight: 1.55, textTransform: 'none',
      },
    },
    components: {
      MuiDialog: {
        defaultProps: {
          slotProps: {
            paper: { elevation: 3 },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: radius.md,
          },
        },
      },
    },
  });
}

export default function getTheme(mode: ThemeMode): Theme {
  return buildTheme(mode === 'light' ? lightTokens : darkTokens);
}
