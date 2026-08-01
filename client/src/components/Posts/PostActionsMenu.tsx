import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface PostActionsMenuProps {
  onReport: () => void;
  onBlock?: () => void;
  blocked?: boolean;
  showBlock?: boolean;
}

export default function PostActionsMenu({
  onReport, onBlock, blocked = false, showBlock = false,
}: PostActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton size="small" onClick={handleOpen}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose}>
        <MenuItem onClick={() => { onReport(); handleClose(); }}>Report post</MenuItem>
        {showBlock && (
        <MenuItem onClick={() => { onBlock?.(); handleClose(); }}>
          {blocked ? 'Unblock user' : 'Block user'}
        </MenuItem>
        )}
      </Menu>
    </>
  );
}
