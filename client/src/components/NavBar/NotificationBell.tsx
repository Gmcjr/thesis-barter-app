import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNotifications } from '../../context/NotificationContext';
import { useRouter } from '../../context/RouterContext';

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const {
    notifications, unreadCount, markRead, markAllRead,
  } = useNotifications();
  const { navigate } = useRouter();

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleClick = async (id: number, link: string | null) => {
    await markRead(id);
    handleClose();
    if (link) navigate(link);
  };

  return (
    <>
      <IconButton size="small" onClick={handleOpen} sx={{ color: 'inherit' }}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon fontSize="small" />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleClose}
        slotProps={{ paper: { sx: { width: 340, maxHeight: 420 } } }}
      >
        <Box sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1,
        }}
        >
          <Typography variant="subtitle2">Notifications</Typography>
          {unreadCount > 0 && (
          <Typography
            variant="caption"
            color="primary"
            sx={{ cursor: 'pointer' }}
            onClick={() => { markAllRead(); }}
          >
            Mark all read
          </Typography>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 && (
        <MenuItem disabled>No notifications yet</MenuItem>
        )}
        {notifications.map((n) => (
          <MenuItem
            key={n.id}
            onClick={() => handleClick(n.id, n.link)}
            sx={{
              whiteSpace: 'normal', alignItems: 'flex-start', opacity: n.readAt ? 0.6 : 1,
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: n.readAt ? 400 : 600 }}>
                {n.title}
              </Typography>
              {n.body && (
              <Typography variant="caption" color="text.secondary">
                {n.body}
              </Typography>
              )}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
