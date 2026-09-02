import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckIcon from '@mui/icons-material/Check';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useSettings } from '../../context/SettingsContext';
import type { ContrastMode } from '../../theme';

const CONTRAST_OPTIONS: { value: ContrastMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function SettingsMenu() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const {
    mode, setMode, contrast, setContrast,
  } = useSettings();

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        aria-label="Display settings"
        sx={{ color: 'inherit' }}
      >
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

        <Divider />
        <ListSubheader disableSticky>Contrast</ListSubheader>
        {CONTRAST_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            selected={contrast === option.value}
            onClick={() => {
              setContrast(option.value);
              handleClose();
            }}
          >
            <ListItemIcon>
              {contrast === option.value && <CheckIcon fontSize="small" />}
            </ListItemIcon>
            {option.label}
          </MenuItem>
        ))}

      </Menu>
    </>
  );
}
