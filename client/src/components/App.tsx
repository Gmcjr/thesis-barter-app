import React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import ThemeProvider from '@mui/system/ThemeProvider';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import theme from '../theme';
import { AuthProvider } from '../context/AuthContext';
import { RouterProvider, Router, type RouteDef } from '../context/RouterContext';

// component imports
import NavBar from './NavBar/NavBar';
import Posts from './Posts/Posts';
import Profile from './Profile/Profile';
import NotFound from './NotFound/NotFound';

const routes: RouteDef[] = [
  { path: '/', component: Posts },
  { path: '/profile', component: Profile, requiresAuth: true },
  { path: '/profile/:id', component: Profile },
];

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <RouterProvider>
          <NavBar />
          <Box
            component="main"
            sx={{
              pt: 16, pb: 8, backgroundColor: '#e1e5f8', minHeight: '100vh',
            }}
          >
            <Container maxWidth="md">
              <Router routes={routes} notFound={NotFound} />
            </Container>
          </Box>
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
