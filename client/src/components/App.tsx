import React, { useMemo } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import ThemeProvider from '@mui/system/ThemeProvider';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import getTheme from '../theme';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import { RouterProvider, Router, type RouteDef } from '../context/RouterContext';
import { SocketProvider } from '../context/SocketContext';

// component imports
import NavBar from './NavBar/NavBar';
import Posts from './Posts/Posts';
import Profile from './Profile/Profile';
import ModQueue from './Moderation/ModQueue';
import BlockedUsers from './BlockedUsers/BlockedUsers';
import NotFound from './NotFound/NotFound';
import Messages from './DMs/Messages';
import DmNotifications from './DMs/DmNotifications';
import ScreeningNotifications from './DMs/ScreeningNotifications';

const routes: RouteDef[] = [
  { path: '/', component: Posts },
  {
    path: '/moderation',
    component: ModQueue,
    requiresAuth: true,
    requiresRole: ['MODERATOR', 'ADMIN'],
  },
  { path: '/blocked-users', component: BlockedUsers, requiresAuth: true },
  { path: '/profile', component: Profile, requiresAuth: true },
  { path: '/profile/:id', component: Profile },
  { path: '/messages', component: Messages, requiresAuth: true },
  { path: '/messages/:id', component: Messages, requiresAuth: true },
];

function AppShell() {
  const { mode } = useSettings();
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <RouterProvider>
              <NavBar />
              <DmNotifications />
              <ScreeningNotifications />
              <Box
                component="main"
                sx={{
                  pt: 16, pb: 8, backgroundColor: 'background.default', minHeight: '100vh',
                }}
              >
                <Container maxWidth="md">
                  <Router routes={routes} notFound={NotFound} />
                </Container>
              </Box>
            </RouterProvider>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppShell />
    </SettingsProvider>
  );
}

export default App;
