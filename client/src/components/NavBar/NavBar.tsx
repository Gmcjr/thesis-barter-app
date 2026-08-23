/* eslint-disable max-len */
/* eslint-disable no-nested-ternary */
import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import MessageIcon from '@mui/icons-material/Message';
import SettingsIcon from '@mui/icons-material/Settings';
import axios from 'axios';

import Badge from '@mui/material/Badge';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import GavelIcon from '@mui/icons-material/Gavel';
import { Link, useRouter } from '../../context/RouterContext';
import SettingsMenu from './SettingsMenu';
import NotificationBell from './NotificationBell';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth, isModerator } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import NewPost, { type PostFormData } from '../Posts/NewPost';

function NavBar() {
  const { path, navigate } = useRouter();
  const { user, loading, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [userMenuTarget, setUserMenuTarget] = useState<null | HTMLElement>(null);

  const navLinks = [
    { to: '/messages', label: 'Messages', icon: <MessageIcon /> },
  ];

  // create a post
  const handleCreatePost = async (formData: PostFormData) => {
    showToast('Post submitted - running automatic screening...', 'info');
    try {
      await axios.post('/posts', {
        title: formData.title,
        name: formData.name,
        offerType: formData.offerType,
        category: formData.category,
        message: formData.description,
        condition: formData.condition,
        isLocal: formData.isLocal,
        zipCode: formData.zipCode,
        radiusMiles: formData.radiusMiles,
        previewMediaId: formData.previewMediaId,
        fullMediaId: formData.fullMediaId,
      });

      showToast('Screening complete. Your post is live', 'success');
    // Adds in 'violates community guidelines' message for a rejected post during pre-screen
    } catch (requestError) {
      console.error('Failed to create post:', requestError);
      const message = axios.isAxiosError(requestError) && requestError.response?.data?.error
        ? requestError.response.data.error
        : 'Could not create post - check your connection and try, try again.';
      showToast(message, 'error');
      throw requestError;
    }
  };

  return (
    <AppBar position="fixed" elevation={2} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
      <Toolbar sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1,
        px: { xs: 1.5, sm: 3, md: 4 },
        gap: { xs: 1, sm: 2 },
        flexWrap: { xs: 'wrap', md: 'nowrap' },
        maxWidth: 'md',
        width: '100%',
        mx: 'auto',
      }}
      >

        {/* App Name (maybe logo later?) */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Typography
            variant="h3"
            sx={{
              color: 'accent.main',
              cursor: 'pointer',
              fontSize: { xs: '1.4rem', sm: '1.75rem' },
              flexShrink: 0,
              textDecoration: 'none',
              transition: 'color 0.15s ease',
              '&:hover': { color: 'accent.dark' },
            }}
          >
            Barta
          </Typography>
        </Link>

        {/* NavLinks */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 2 },
          flexShrink: 0,
          order: { xs: 2, md: 3 },
        }}
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 1 },
          }}
          >
            {navLinks.map(({ to, label, icon }) => {
              const active = to === '/'
                ? path === '/'
                : path.startsWith(to);
              return (
                <Button
                  key={to}
                  variant="contained"
                  size="small"
                  startIcon={icon}
                  disabled={!user}
                  onClick={() => navigate(to)}
                  sx={{
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    px: 2,
                    fontWeight: active ? 700 : 600,
                  }}
                >
                  {label}
                </Button>
              );
            })}

            {/* New Post Button */}
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              disabled={!user}
              onClick={() => setModalOpen(true)}
              sx={{
                textTransform: 'none',
                whiteSpace: 'nowrap',
                px: 2,
                fontWeight: 600,
              }}
            >
              New Post
            </Button>
          </Box>

          {/* Username + Avatar + modal with: Google Login / Logout + Accessibility Settins + Profile link */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            pl: 1,
            borderLeft: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
          >
            {loading ? (
              <Typography variant="caption" color="text.secondary">Loading…</Typography>
            ) : (
              <>
                <Box
                  onClick={(e) => setUserMenuTarget(e.currentTarget)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: 'primary.main',
                      fontSize: '0.75rem',
                    }}
                  >
                    {user ? (user.name ?? user.email).charAt(0).toUpperCase() : 'G'}
                  </Avatar>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    {user ? (user.name ?? user.email) : 'Guest User'}
                  </Typography>
                </Box>
                <Menu
                  anchorEl={userMenuTarget}
                  open={Boolean(userMenuTarget)}
                  onClose={() => setUserMenuTarget(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  {/* Profile only visible when logged in */}
                  {user && (
                    <MenuItem onClick={() => { setUserMenuTarget(null); navigate('/profile'); }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon sx={{ fontSize: '1.25rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Profile
                        </Typography>
                      </Box>
                    </MenuItem>
                  )}

                  {/* Moderation Queue Item - moderators/admins only, hidden otherwise */}
                  {isModerator(user?.role ?? null) && (
                    <MenuItem onClick={() => { setUserMenuTarget(null); navigate('/moderation'); }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GavelIcon sx={{ fontSize: '1.25rem' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Moderation Queue
                        </Typography>
                      </Box>
                    </MenuItem>
                  )}

                  {/* Settings Item */}
                  <MenuItem
                    disableRipple
                    sx={{
                      p: 0,
                      position: 'relative',
                      '& button, & .MuiIconButton-root': {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        zIndex: 2,
                        cursor: 'pointer',
                      },
                    }}
                  >
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1, width: '100%',
                    }}
                    >
                      <SettingsIcon sx={{ fontSize: '1.25rem' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, pointerEvents: 'none', zIndex: 1 }}>
                        Settings
                      </Typography>
                      <SettingsMenu />
                    </Box>
                  </MenuItem>

                  {/* Notifications Item */}
                  <MenuItem
                    disableRipple
                    sx={{
                      p: 0,
                      position: 'relative',
                      '& button, & .MuiIconButton-root': {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        zIndex: 2,
                        cursor: 'pointer',
                      },
                    }}
                  >
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 1,
                      width:
  '100%',
                    }}
                    >
                      <Badge badgeContent={unreadCount} color="error">
                        <NotificationsIcon sx={{ fontSize: '1.25rem' }} />
                      </Badge>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          pointerEvents: 'none',
                          zIndex: 1,
                        }}
                      >
                        Notifications
                      </Typography>
                      <NotificationBell />
                    </Box>
                  </MenuItem>

                  {/* Log out when logged in / Sign in with Google when logged out */}
                  {user ? (
                    <MenuItem onClick={() => { setUserMenuTarget(null); logout(); }}>
                      Log out
                    </MenuItem>
                  ) : (
                    <MenuItem onClick={() => { setUserMenuTarget(null); window.location.href = '/oauth2/login'; }}>
                      Sign in with Google
                    </MenuItem>
                  )}
                </Menu>
              </>
            )}
          </Box>
        </Box>
      </Toolbar>

      {/* NewPost Modal */}
      <NewPost
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreatePost}
      />
    </AppBar>
  );
}

export default NavBar;
