import { createTheme, type Theme } from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark';

export const radius = {
  sm: '6px', md: '10px', lg: '16px', xl: '22px', pill: '9999px',
};

// Design tokens single source of truth for color/font values in app
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
  display: '"Lora", Georgia, "Times New Roman", serif',
  body: '"Karla", -apple-system, BlinkMacSystemFont, sans-serif',
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

export default function getTheme(mode: ThemeMode): Theme {
  const light = mode === 'light';

  return createTheme({
    palette: {
      mode,
      background: {
        default: light ? cream[50] : '#060505',
        paper: light ? '#ffffff' : '#0b0b0a',
      },
      primary: {
        main: light ? clay[500] : clay[400],
        light: clay[100],
        dark: clay[600],
      },
      secondary: {
        main: light ? sage[500] : sage[400],
        light: sage[100],
        dark: sage[600],
      },
      accent: {
        main: ochre[400],
        light: ochre[100],
        dark: ochre[500],
      },
      error: {
        main: light ? brick[500] : brick[400],
        light: brick[100],
        dark: brick[600],
      },
      warning: {
        main: ochre[600],
        light: ochre[100],
      },
      success: {
        main: light ? sage[600] : sage[400],
        light: sage[100],
      },
      info: {
        main: dusty[500],
        light: dusty[100],
      },
      divider: light ? ink[100] : ink[700],
      text: {
        primary: light ? ink[900] : '#ede8f2',
        secondary: light ? ink[700] : ink[200],
      },
      surface: {
        sunken: light ? cream[100] : '#161513',
        overlay: light ? 'rgba(43,36,32,0.5)' : 'rgba(0,0,0,0.6)',
      },
      border: {
        subtle: light ? ink[100] : ink[700],
        default: light ? ink[200] : ink[500],
        strong: light ? ink[300] : ink[300],
      },
      link: {
        main: light ? clay[600] : clay[300],
        hover: light ? clay[700] : clay[200],
      },
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: fonts.body,
      h1: { fontFamily: fonts.display },
      h2: { fontFamily: fonts.display },
      h3: { fontFamily: fonts.display },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 6,
            fontWeight: 600,
          },
        },
      },
    },
  });
}

// export default function getTheme(mode: ThemeMode): Theme {
//   return createTheme({
//     palette: {
//       mode,
//       background: {
//         default: mode === 'light' ? '#f5e5d1' : '#131210',
//         paper: mode === 'light' ? '#f9f1e7' : '#292527',
//       },
//       primary: {
//         main: mode === 'light' ? '#161413' : '#c47928',
//       },
//       text: {
//         primary: mode === 'light' ? '#141313' : '#f5e8db',
//       },
//     },
//     shape: {
//       borderRadius: 8,
//     },
//     components: {
//       MuiButton: {
//         styleOverrides: {
//           root: {
//             textTransform: 'none',
//             borderRadius: 8,
//             fontWeight: 600,
//           },
//         },
//       },
//     },
//   });
// }
