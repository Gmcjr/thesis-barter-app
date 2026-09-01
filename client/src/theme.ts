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

// A theme is a self-contained set of every palette value
// A new theme (light/dark/custom) can fill in this shape with its own values
export interface ThemeTokens {
    mode: ThemeMode;
    background: { default: string; paper: string };
    primary: { main: string; light: string; dark: string; contrastText?: string };
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
    onPrimary?: string;
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
      surfaceContainerLowest: '#fffdfb',
      surfaceContainerLow: '#fff7ef',
      surfaceContainer: '#fbeedf',
      surfaceContainerHigh: '#f3e3cf',
      surfaceContainerHighest: '#ead8c1',
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
      surfaceContainerLowest: '#FFFDFB',
      surfaceContainerLow: '#F7EFE4',
      surfaceContainer: '#EFE4D3',
      surfaceContainerHigh: '#E4D5BF',
      surfaceContainerHighest: '#D6C3A8',
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
      surfaceContainerLowest: '#FBF4EA',
      surfaceContainerLow: '#EFE2D0',
      surfaceContainer: '#E1D0B7',
      surfaceContainerHigh: '#D2BC9C',
      surfaceContainerHighest: '#C3AB84',
    },
  },
  dark: {
    normal: {
      primary: '#b0621b',
      secondary: '#c9a98c',
      tertiary: '#d98e5b',
      error: '#FFB4AB',
      background: '#24201c',
      surface: '#2e2823',
      onBackground: '#F1DFD8',
      onSurfaceVariant: '#D7C3B8',
      outline: '#a08a7c',
      outlineVariant: '#4a3f38',
      surfaceContainerLowest: '#151210',
      surfaceContainerLow: '#191410',
      surfaceContainer: '#322a24',
      surfaceContainerHigh: '#3c332c',
      surfaceContainerHighest: '#473c34',
      onPrimary: '#ffffff',
    },
    medium: {
      primary: '#e58a45',
      secondary: '#D9BFA3',
      tertiary: '#E7A877',
      error: '#FFD2CC',
      background: '#1A140E',
      surface: '#221B15',
      onBackground: '#F1DFD8',
      onSurfaceVariant: '#EDD8CD',
      outline: '#B8A597',
      outlineVariant: '#5A4E45',
      surfaceContainerLowest: '#0E0A07',
      surfaceContainerLow: '#141009',
      surfaceContainer: '#292219',
      surfaceContainerHigh: '#322A20',
      surfaceContainerHighest: '#3C3328',
      onPrimary: '#2A1B0E',
    },
    high: {
      primary: '#F2A968',
      secondary: '#ECD8C4',
      tertiary: '#F5C39B',
      error: '#FFECE9',
      background: '#16110D',
      surface: '#1E1712',
      onBackground: '#F1DFD8',
      onSurfaceVariant: '#FCF3EE',
      outline: '#C9B8AC',
      outlineVariant: '#6B5D52',
      surfaceContainerLowest: '#000000',
      surfaceContainerLow: '#100C08',
      surfaceContainer: '#241D16',
      surfaceContainerHigh: '#2E2620',
      surfaceContainerHighest: '#382F27',
      onPrimary: '#2A1B0E',
    },
  },
};

const WARNING_BASE = '#F0B92E';
const INFO_BASE = '#ACCCD8';
const SUCCESS_LIGHT = '#827835'; // palettes.tertiary tone 50
const SUCCESS_DARK = '#9C924C';

function tokensFromScheme(mode: ThemeMode, s: SourceScheme): ThemeTokens {
  const light = mode === 'light';
  const primary: ThemeTokens['primary'] = {
    main: s.primary,
    light: lighten(s.primary, 0.25),
    // Dark contained-button :hover fill
    dark: light ? darken(s.primary, 0.2) : darken(s.primary, 0.15),
  };
  // Explicit only where MUI's auto-derived label would fail
  if (s.onPrimary) primary.contrastText = s.onPrimary;
  return {
    mode,
    background: { default: s.background, paper: s.surface },
    primary,
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
      // MD3 only ships outline / outline-variant) — "strong" is derived
      strong: light ? darken(s.outline, 0.25) : lighten(s.outline, 0.3),
    },
    link: {
      main: light ? darken(s.primary, 0.1) : lighten(s.primary, 0.35),
      hover: light ? darken(s.primary, 0.25) : lighten(s.primary, 0.2),
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
    radius,
    typography: typographyTokens,
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDialog: {
        defaultProps: {
          slotProps: {
            paper: { elevation: 3 },
          },
        },
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.surface.container.high,
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: theme.radius.md,
          }),
        },
      },
      // Visible keyboard-focus ring
      MuiButtonBase: {
        styleOverrides: {
          root: ({ theme }) => ({
            '&.Mui-focusVisible': {
              outline: `2px solid ${theme.palette.border.strong}`,
              outlineOffset: 2,
            },
          }),
        },
      },
    },
  });
}

// Contrast defaults to 'normal' here until Settings exposes a contrast toggle
export default function getTheme(mode: ThemeMode, contrast: ContrastMode): Theme {
  return buildTheme(getThemeTokens(mode, contrast));
}
