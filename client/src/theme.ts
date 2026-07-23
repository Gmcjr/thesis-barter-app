import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    background: {
      paper: '#bfc9e2',
    },
    primary: {
      main: '#0f0c68',
    },
    text: {
      primary: '#191d28',
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
