import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { formatInboxTime } from '../../../utils/utils';
import UserAvatar from '../../common/UserAvatar';
import type { CommentData } from './types';

interface CommentItemProps {
  comment: CommentData;
  canDelete: boolean;
  deleting: boolean;
  isReply?: boolean;
  onNavigateToProfile: (userId: number) => void;
  onRequestDelete: (commentId: number) => void;
  onReply?: (comment: CommentData) => void;
}

function Dot() {
  return (
    <Box
      component="span"
      aria-hidden="true"
      sx={{
        width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled', flexShrink: 0,
      }}
    />
  );
}

export default function CommentItem({
  comment, canDelete, deleting, isReply = false, onNavigateToProfile, onRequestDelete, onReply,
}: CommentItemProps) {
  return (
    <Box sx={{
      display: 'flex', gap: 1, alignItems: 'flex-start', py: 0.5,
    }}
    >
      <UserAvatar user={comment.user} size={isReply ? 22 : 26} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap',
        }}
        >
          <Typography
            component="span"
            onClick={() => onNavigateToProfile(comment.user.id)}
            sx={{
              fontWeight: 500,
              fontSize: isReply ? '0.6875rem' : '0.75rem',
              color: 'text.secondary',
              cursor: 'pointer',
              '&:hover': { color: 'text.primary', textDecoration: 'underline' },
            }}
          >
            {comment.user.name ?? comment.user.email}
          </Typography>
          <Dot />
          <Typography component="span" sx={{ fontSize: isReply ? '0.6875rem' : '0.75rem', color: 'text.disabled' }}>
            {formatInboxTime(comment.createdAt)}
          </Typography>
        </Box>
        <Typography
          sx={{
            color: 'text.primary',
            mt: 0.5,
            wordBreak: 'break-word',
            fontSize: isReply ? '0.8125rem' : '0.9375rem',
            lineHeight: 1.45,
          }}
        >
          {comment.text}
        </Typography>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5,
        }}
        >
          {onReply && (
            <Typography
              component="span"
              onClick={() => onReply(comment)}
              sx={{
                color: 'text.disabled',
                cursor: 'pointer',
                fontWeight: 400,
                fontSize: '0.75rem',
                '&:hover': { color: 'text.secondary', textDecoration: 'underline' },
              }}
            >
              Reply
            </Typography>
          )}
          {onReply && canDelete && <Dot />}
          {canDelete && (
            <Typography
              component="span"
              onClick={() => { if (!deleting) onRequestDelete(comment.id); }}
              sx={{
                color: 'text.disabled',
                cursor: deleting ? 'default' : 'pointer',
                fontWeight: 400,
                fontSize: '0.75rem',
                opacity: deleting ? 0.5 : 1,
                '&:hover': deleting ? undefined : { color: 'error.main', textDecoration: 'underline' },
              }}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
