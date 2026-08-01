import { createTheme, type Theme } from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark';

export default function getTheme(mode: ThemeMode): Theme {
  return createTheme({
    palette: {
      mode,
      background: {
        default: mode === 'light' ? '#e1e5f8' : '#12141f',
        paper: mode === 'light' ? '#bfc9e2' : '#1f2333',
      },
      primary: {
        main: mode === 'light' ? '#0f0c68' : '#8b85e8',
      },
      text: {
        primary: mode === 'light' ? '#191d28' : '#e8e9f2',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            fontWeight: 600,
          },
        },
      },
    },
  });
}
