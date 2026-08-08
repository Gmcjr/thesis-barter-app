import {
  createTheme, lighten, darken, type Theme, type TypographyVariantsOptions,
} from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark';
export type ContrastMode = 'normal' | 'medium' | 'high';

export const spacingUnit = 8;

export const radius = {
  sm: '6px', md: '10px', lg: '16px', xl: '22px', pill: '9999px',
};

const fonts = {
  display: '"Young Serif", Georgia, serif',
  body: '"Figtree", system-ui, sans-serif',
};

// Dialog/Paper elevation tint
export interface SurfaceContainerTokens {
  lowest: string; low: string; base: string; high: string; highest: string;
}

// Adds semantic palette slots MUI doesn't have by default
// So components can read theme.palette.accent / .surface / .border / .link instead of hex
declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
    surface: { sunken: string; overlay: string; container: SurfaceContainerTokens };
    border: { subtle: string; default: string; strong: string };
    link: { main: string; hover: string };
  }
  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
    surface?: { sunken: string; overlay: string; container: SurfaceContainerTokens };
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
    surface: { sunken: string; overlay: string; container: SurfaceContainerTokens };
    border: { subtle: string; default: string; strong: string };
    link: { main: string; hover: string };
  }

  interface SourceScheme {
    primary: string; secondary: string; tertiary: string; error: string;
    background: string; surface: string; onBackground: string; onSurfaceVariant: string;
    outline: string; outlineVariant: string;
    surfaceContainerLowest: string; surfaceContainerLow: string; surfaceContainer: string;
    surfaceContainerHigh: string; surfaceContainerHighest: string;
  }

const schemes: Record<ThemeMode, Record<ContrastMode, SourceScheme>> = {
  light: {
    normal: {
      primary: '#b55515',
      secondary: '#a87a3a',
      tertiary: '#6d781b',
      error: '#904A43',
      background: '#fff3e8',
      surface: '#f8e2c8',
      onBackground: '#201813',
      onSurfaceVariant: '#29222b',
      outline: '#f9ddcb',
      outlineVariant: '#ece2d9',
      surfaceContainerLowest: '#f8f2e4',
      surfaceContainerLow: '#fbead3',
      surfaceContainer: '#cada7ec4',
      surfaceContainerHigh: '#e3ba2597',
      surfaceContainerHighest: '#b66c05',
    },
    medium: {
      primary: '#5C260A',
      secondary: '#5C260B',
      tertiary: '#3C370C',
      error: '#5E231E',
      background: '#FFF8F6',
      surface: '#FFF7FF',
      onBackground: '#221A16',
      onSurfaceVariant: '#40332C',
      outline: '#5E4F47',
      outlineVariant: '#7A6A61',
      surfaceContainerLowest: '#FFFFFF',
      surfaceContainerLow: '#F9F1F9',
      surfaceContainer: '#EDE6EE',
      surfaceContainerHigh: '#E2DBE2',
      surfaceContainerHighest: '#D6CFD7',
    },
    high: {
      primary: '#4F1D02',
      secondary: '#4F1D03',
      tertiary: '#322D03',
      error: '#511A15',
      background: '#FFF8F6',
      surface: '#FFF7FF',
      onBackground: '#221A16',
      onSurfaceVariant: '#000000',
      outline: '#362A22',
      outlineVariant: '#54463E',
      surfaceContainerLowest: '#f7f1fa',
      surfaceContainerLow: '#ede0ed',
      surfaceContainer: '#d5c8d5',
      surfaceContainerHigh: '#c6bdc8',
      surfaceContainerHighest: '#bab0bc',
    },
  },
  dark: {
    normal: {
      primary: '#b05e12',
      secondary: '#FFB596',
      tertiary: '#b3c989',
      error: '#FFB4AB',
      background: '#2a2826',
      surface: '#2f2e31',
      onBackground: '#F1DFD8',
      onSurfaceVariant: '#D7C3B8',
      outline: '#9F8D83',
      outlineVariant: '#52443C',
      surfaceContainerLowest: '#100D12',
      surfaceContainerLow: '#1D1A20',
      surfaceContainer: '#211E24',
      surfaceContainerHigh: '#2C292F',
      surfaceContainerHighest: '#373339',
    },
    medium: {
      primary: '#FFD3C1',
      secondary: '#FFD3C1',
      tertiary: '#E8DDA3',
      error: '#FFD2CC',
      background: '#1A120E',
      surface: '#151218',
      onBackground: '#F1DFD8',
      onSurfaceVariant: '#EDD8CD',
      outline: '#C1AEA4',
      outlineVariant: '#9F8D83',
      surfaceContainerLowest: '#09070B',
      surfaceContainerLow: '#1F1C22',
      surfaceContainer: '#2A272C',
      surfaceContainerHigh: '#353137',
      surfaceContainerHighest: '#403C42',
    },
    high: {
      primary: '#FFECE5',
      secondary: '#FFECE5',
      tertiary: '#FCF1B5',
      error: '#FFECE9',
      background: '#1A120E',
      surface: '#151218',
      onBackground: '#F1DFD8',
      onSurfaceVariant: '#FFFFFF',
      outline: '#FFECE3',
      outlineVariant: '#D3BFB4',
      surfaceContainerLowest: '#000000',
      surfaceContainerLow: '#211E24',
      surfaceContainer: '#332F35',
      surfaceContainerHigh: '#3E3A40',
      surfaceContainerHighest: '#49454C',
    },
  },
};

const WARNING_BASE = '#E7A900';
const INFO_BASE = '#ACCCD8';
const SUCCESS_LIGHT = '#827835'; // palettes.tertiary tone 50
const SUCCESS_DARK = '#9C924C';

function tokensFromScheme(mode: ThemeMode, s: SourceScheme): ThemeTokens {
  const light = mode === 'light';
  return {
    mode,
    background: { default: s.background, paper: s.surface },
    primary: { main: s.primary, light: lighten(s.primary, 0.25), dark: darken(s.primary, 0.2) },
    secondary: {
      main: s.secondary,
      light: lighten(s.secondary, 0.25),
      dark: darken(s.secondary, 0.2),
    },
    accent: { main: s.tertiary, light: lighten(s.tertiary, 0.25), dark: darken(s.tertiary, 0.2) },
    error: { main: s.error, light: lighten(s.error, 0.25), dark: darken(s.error, 0.2) },
    warning: {
      main: light ? WARNING_BASE : lighten(WARNING_BASE, 0.3),
      light: lighten(light ? WARNING_BASE : lighten(WARNING_BASE, 0.3), 0.25),
    },
    success: {
      main: light ? SUCCESS_LIGHT : SUCCESS_DARK,
      light: lighten(light ? SUCCESS_LIGHT : SUCCESS_DARK, 0.25),
    },
    info: {
      main: light ? darken(INFO_BASE, 0.15) : INFO_BASE,
      light: lighten(light ? darken(INFO_BASE, 0.15) : INFO_BASE, 0.25),
    },
    divider: s.outlineVariant,
    text: { primary: s.onBackground, secondary: s.onSurfaceVariant },
    surface: {
      sunken: s.surfaceContainerLow,
      // MD3's scrim role is #000000 in every scheme; apps apply their own opacity.
      overlay: light ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.8)',
      container: {
        lowest: s.surfaceContainerLowest,
        low: s.surfaceContainerLow,
        base: s.surfaceContainer,
        high: s.surfaceContainerHigh,
        highest: s.surfaceContainerHighest,
      },
    },
    border: {
      subtle: s.outlineVariant,
      default: s.outline,
      // MD3 only ships 2 outline tiers (outline / outline-variant) — no third "strong" role,
      // so this is derived rather than sourced.
      strong: darken(s.outline, 0.25),
    },
    link: {
      main: darken(s.primary, 0.1),
      hover: darken(s.primary, 0.25),
    },
  };
}

function buildTokenTable(): Record<ThemeMode, Record<ContrastMode, ThemeTokens>> {
  return {
    light: {
      normal: tokensFromScheme('light', schemes.light.normal),
      medium: tokensFromScheme('light', schemes.light.medium),
      high: tokensFromScheme('light', schemes.light.high),
    },
    dark: {
      normal: tokensFromScheme('dark', schemes.dark.normal),
      medium: tokensFromScheme('dark', schemes.dark.medium),
      high: tokensFromScheme('dark', schemes.dark.high),
    },
  };
}

const tokenTable = buildTokenTable();

export function getThemeTokens(mode: ThemeMode, contrast: ContrastMode): ThemeTokens {
  return tokenTable[mode][contrast];
}

// Exported directly for anywhere that wants a specific palette without building a Theme
export const lightTokens = tokenTable.light.normal;
export const darkTokens = tokenTable.dark.normal;

export const typographyTokens: TypographyVariantsOptions = {
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
    spacing: spacingUnit,
    shape: {
      borderRadius: 10,
    },
    typography: typographyTokens,
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

// Contrast defaults to 'normal' here until Settings exposes a contrast toggle
export default function getTheme(mode: ThemeMode, contrast: ContrastMode): Theme {
  return buildTheme(getThemeTokens(mode, contrast));
}
