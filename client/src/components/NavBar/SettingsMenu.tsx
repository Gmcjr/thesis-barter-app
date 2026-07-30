import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SettingsIcon from '@mui/icons-material/Settings';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';

export default function SettingsMenu() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { mode, setMode } = useSettings();
  const { user } = useAuth();
  const { navigate } = useRouter();

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const isModerator = user?.role === 'MODERATOR' || user?.role === 'ADMIN';

  return (
    <>
      <IconButton size="small" onClick={handleOpen} sx={{ color: 'inherit' }}>
        <SettingsIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose}>
        <MenuItem onClick={() => {
          setMode(mode === 'dark' ? 'light' : 'dark');
          handleClose();
        }}
        >
          {mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </MenuItem>
        {isModerator && (
          <MenuItem onClick={() => { navigate('/moderation'); handleClose(); }}>
            Moderation Queue
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
