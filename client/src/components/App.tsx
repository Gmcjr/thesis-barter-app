import React, { useMemo } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import ThemeProvider from '@mui/system/ThemeProvider';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import getTheme from '../theme';
import { AuthProvider, MODERATOR_ROLES } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import { RouterProvider, Router, type RouteDef } from '../context/RouterContext';
import { SocketProvider } from '../context/SocketContext';
import { NotificationProvider } from '../context/NotificationContext';

// component imports
import NavBar from './NavBar/NavBar';
import Posts from './Posts/Posts';
import Profile from './Profile/Profile';
import ModQueue from './Moderation/ModQueue';
import BlockedUsers from './BlockedUsers/BlockedUsers';
import NotFound from './NotFound/NotFound';
import Messages from './DMs/Messages';
import DeletedConversations from './DMs/DeletedConversations';
import LocationSetupModal from './Location/LocationSetupModal';
import Footer from './Footer/Footer';
import Terms from './Footer/Terms';
import Privacy from './Footer/Privacy';
import Contact from './Footer/Contact';
import Help from './Footer/Help';

const routes: RouteDef[] = [
  { path: '/', component: Posts },
  {
    path: '/moderation',
    component: ModQueue,
    requiresAuth: true,
    requiresRole: [...MODERATOR_ROLES],
  },
  { path: '/blocked-users', component: BlockedUsers, requiresAuth: true },
  { path: '/profile', component: Profile, requiresAuth: true },
  { path: '/profile/:id', component: Profile },
  { path: '/profile/offers/:offerId', component: Profile },
  { path: '/profile/history/:postId', component: Profile },
  { path: '/profile/reviews/:reviewId', component: Profile },
  { path: '/profile/requests/:postId/:requestId', component: Profile },
  { path: '/trade/:postId', component: Posts },
  { path: '/messages', component: Messages, requiresAuth: true },
  { path: '/messages/:id', component: Messages, requiresAuth: true },
  { path: '/deleted-conversations', component: DeletedConversations, requiresAuth: true },
  { path: '/terms', component: Terms },
  { path: '/privacy', component: Privacy },
  { path: '/contact', component: Contact },
  { path: '/help', component: Help },
];

function AppShell() {
  const { mode, contrast } = useSettings();
  const theme = useMemo(() => getTheme(mode, contrast), [mode, contrast]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <RouterProvider>
                <NavBar />
                <LocationSetupModal />

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

                <Footer />
              </RouterProvider>
            </NotificationProvider>
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
