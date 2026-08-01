import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';

import PostActionsMenu from '../Posts/PostActionsMenu';
import type { ProfileTradesProps } from './types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ProfileTrades({ posts, isOwnProfile, onReport }: ProfileTradesProps) {
  const { blockedUserIds, blockUser, unblockUser } = useAuth();
  const { showToast } = useToast();

  const handleBlockToggle = async (userId: number) => {
    try {
      if (blockedUserIds.includes(userId)) {
        await unblockUser(userId);
      } else {
        await blockUser(userId);
      }
    } catch {
      showToast('Could not update block status - try again.', 'error');
    }
  };
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', gap: 3, px: { xs: 2, md: 0 },
    }}
    >
      {posts.length === 0 && (
        <Typography color="text.secondary">No trades found.</Typography>
      )}

      {posts.map((post) => {
        const postUser = post.user.name ?? post.user.email;

        return (
          <Card key={post.id} variant="outlined" sx={{ borderRadius: 3, borderColor: '#e0e0e0' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1,
              }}
              >
                <Box sx={{
                  display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap',
                }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {post.title}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Posted on
                    {` ${new Date(post.createdAt).toLocaleDateString()}`}
                  </Typography>

                  {post.status === 'COMPLETED' && (
                    <Chip size="small" color="success" label="Trade Completed" />
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{
                    bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.9rem',
                  }}
                  >
                    {postUser.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {postUser}
                  </Typography>
                  <Button size="small" variant="outlined" sx={{ borderRadius: 4, textTransform: 'none' }}>
                    Open DM
                  </Button>
                </Box>

                {!isOwnProfile && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PostActionsMenu
                      onReport={() => onReport(post.id)}
                      showBlock
                      blocked={blockedUserIds.includes(post.userId)}
                      onBlock={() => handleBlockToggle(post.userId)}
                    />
                  </Box>
                )}
              </Box>

              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                {post.message}
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: '600', color: 'text.secondary' }}>
                Comments
              </Typography>

              {post.comments.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {post.comments.map((comment) => (
                    <Box
                      key={comment.id}
                      sx={{
                        display: 'flex', gap: 2, alignItems: 'flex-start', p: 1.5, bgcolor: '#f4f6f8', borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {comment.text}
                      </Typography>
                      <Button size="small" sx={{ textTransform: 'none', minWidth: 'auto' }}>DM</Button>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.disabled" sx={{ mb: 2, fontStyle: 'italic' }}>
                  No comments...
                </Typography>
              )}

              <Box sx={{ display: 'flex', mt: 3, gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Add a comment..."
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
                />
                <Button variant="contained" disableElevation sx={{ borderRadius: 8, textTransform: 'none' }}>
                  Send
                </Button>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
