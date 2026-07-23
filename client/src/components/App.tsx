import React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import ThemeProvider from '@mui/system/ThemeProvider';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import theme from '../theme';

// component imports
import NavBar from './NavBar/NavBar';
import Posts from './Posts/Posts';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NavBar />
      <Box
        component="main"
        sx={{
          pt: 16, pb: 8, backgroundColor: '#e1e5f8', minHeight: '100vh',
        }}
      >
        <Container maxWidth="md">
          <Posts />
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
