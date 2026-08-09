import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ManagePosts, { type PostData, type PostUpdateData } from './ManagePosts';

interface PostActionsMenuProps {
  onReport: () => void;
  onBlock?: () => void;
  blocked?: boolean;
  showBlock?: boolean;
  showReport?: boolean;
  showManage?: boolean;
  managePosts?: PostData[];
  onUpdate?: (postId: number, postData: PostUpdateData) => Promise<void>;
  onDelete?: (postId: number) => Promise<void>;
  onComplete?: (tradeId: number) => Promise<void>;
}

export default function PostActionsMenu({
  onReport, onBlock, blocked = false, showBlock = false, showReport = true,
  showManage = false, managePosts = [], onUpdate, onDelete, onComplete,
}: PostActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  if (!showReport && !showBlock && !showManage) return null;

  return (
    <>
      <IconButton size="small" onClick={handleOpen}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose}>
        {showManage && (
        <MenuItem onClick={() => { setManageOpen(true); handleClose(); }}>Manage post</MenuItem>
        )}
        {showReport && (
        <MenuItem onClick={() => { onReport(); handleClose(); }}>Report post</MenuItem>
        )}
        {showBlock && (
        <MenuItem onClick={() => { onBlock?.(); handleClose(); }}>
          {blocked ? 'Unblock user' : 'Block user'}
        </MenuItem>
        )}
      </Menu>
      {showManage && (
        <ManagePosts
          open={manageOpen}
          onClose={() => setManageOpen(false)}
          posts={managePosts}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onComplete={onComplete}
        />
      )}
    </>
  );
}
