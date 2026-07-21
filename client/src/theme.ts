import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    background: {
      paper: '#ffffff',
    },
    primary: {
      main: '#27227e',
    },
    text: {
      primary: '#0f172a',
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

export default theme;
