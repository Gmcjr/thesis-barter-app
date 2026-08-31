import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import { formatInboxTime } from '../../../utils/utils';
import UserAvatar from '../../common/UserAvatar';
import { radius } from '../../../theme';
import type { CommentData } from './types';

interface CommentItemProps {
  comment: CommentData;
  canDelete: boolean;
  deleting: boolean;
  onNavigateToProfile: (userId: number) => void;
  onRequestDelete: (commentId: number) => void;
}

export default function CommentItem({
  comment, canDelete, deleting, onNavigateToProfile, onRequestDelete,
}: CommentItemProps) {
  return (
    <Box
      sx={{
        display: 'flex', gap: 1.5, alignItems: 'flex-start', p: 1.5, bgcolor: 'surface.sunken', borderRadius: radius.md,
      }}
    >
      <UserAvatar user={comment.user} size={28} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography
            variant="body2"
            onClick={() => onNavigateToProfile(comment.user.id)}
            sx={{
              fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' },
            }}
          >
            {comment.user.name ?? comment.user.email}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatInboxTime(comment.createdAt)}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.primary', mt: 0.25, wordBreak: 'break-word' }}>
          {comment.text}
        </Typography>
      </Box>
      {canDelete && (
        <IconButton
          size="small"
          aria-label="Delete comment"
          disabled={deleting}
          onClick={() => onRequestDelete(comment.id)}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}
