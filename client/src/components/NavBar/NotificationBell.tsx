import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNotifications } from '../../context/NotificationContext';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { unreadCount } = useNotifications();

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton size="small" onClick={handleOpen} sx={{ color: 'inherit' }}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon fontSize="small" />
        </Badge>
      </IconButton>
      <Popover
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              width: 400, maxHeight: 480, display: 'flex', flexDirection: 'column',
            },
          },
        }}
      >
        {!!anchorEl && <NotificationPanel onClose={handleClose} />}
      </Popover>
    </>
  );
}
