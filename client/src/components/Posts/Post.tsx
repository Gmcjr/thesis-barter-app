/* eslint-disable react/jsx-one-expression-per-line */
import React, { useState } from 'react';
import axios from 'axios';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import DownloadIcon from '@mui/icons-material/Download';
import CircularProgress from '@mui/material/CircularProgress';

import { formatPostDate } from '../../utils/utils';
import type { PostData } from './ManagePosts';

import PostActionsMenu from './PostActionsMenu';
import ArtTradeOffer from './ArtTradeOffer';
import type { TradeRequestData } from '../Trades/RequestTradeButton';
import RequestTradeButton from '../Trades/RequestTradeButton';
import IncomingTradeRequests from '../Trades/IncomingTradeRequests';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useRouter } from '../../context/RouterContext';
import { radius } from '../../theme';

interface PostProps {
  post: PostData;
  onReport: () => void;
  myTradeRequests: TradeRequestData | null;
  onTradeActivity: () => void | Promise<void>;
  onOfferSubmitted?: () => void;
}

export default function Post({
  post, onReport, myTradeRequests, onTradeActivity, onOfferSubmitted,
}: PostProps) {
  const postUser = post.user.name ?? post.user.email;
  const {
    user, blockedUserIds, blockUser, unblockUser,
  } = useAuth();
  const { showToast } = useToast();
  const { navigate } = useRouter();
  const isOwnPost = user?.id === post.userId;
  const isBlocked = blockedUserIds.includes(post.userId);
  const [downloadingFull, setDownloadingFull] = useState(false);

  const completedOffer = post.tradeOffers?.find((o) => o.status === 'COMPLETED');
  const receivedUrl = isOwnPost
    ? (completedOffer?.fullUrl ?? undefined)
    : (post.fullUrl ?? undefined);

  const handleDownloadFull = async (imageUrl: string) => {
    try {
      setDownloadingFull(true);
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;

      const safeTitle = post.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `Art_Received_${safeTitle}.jpg`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to save file:', err);
      window.open(imageUrl, '_blank');
    } finally {
      setDownloadingFull(false);
    }
  };

  const handleBlockToggle = async () => {
    try {
      if (isBlocked) {
        await unblockUser(post.userId);
        showToast('User unblocked', 'success');
      } else {
        await blockUser(post.userId);
        showToast('User blocked', 'success');
      }
    } catch {
      showToast('Could not update block status - try again.', 'error');
    }
  };

  const handleOpenDM = async () => {
    try {
      const res = await axios.post<{ id: number }>(
        '/dms',
        { userId: post.user.id },
        { withCredentials: true },
      );
      navigate(`/messages/${res.data.id}`);
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Could not start conversation.';
      showToast(message, 'error');
    }
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: radius.md, borderColor: 'border.default' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{
          display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: { xs: 'flex-start', sm: 'space-between' }, alignItems: { xs: 'stretch', sm: 'flex-start' }, mb: 2, gap: { xs: 1, sm: 2 },
        }}
        >
          {/* title, date, "Trade Complete" chip */}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{
              display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 1.5,
            }}
            >

              <Typography variant="h5" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
                {post.title}
              </Typography>

              {post.status === 'COMPLETED' && (
                <Chip
                  size="small"
                  color="success"
                  label="Trade Completed"
                />
              )}
            </Box>

            <Typography variant="caption" color="text.secondary">
              {((post.updatedAt && post.updatedAt !== post.createdAt) && `Updated on ${formatPostDate(post.updatedAt)}`) || `Posted on ${formatPostDate(post.createdAt)}`}
            </Typography>
          </Box>

          {/* user avatar, name, DM button and report modal */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, flexWrap: 'wrap',
          }}
          >
            <Box
              onClick={() => navigate(`/profile/${post.user.id}`)}
              role="button"
              tabIndex={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                '&:hover .post-username': { textDecoration: 'underline' },
              }}
            >
              <Avatar sx={{
                bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.9rem',
              }}
              >
                {postUser.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="subtitle2" className="post-username" sx={{ fontWeight: 600 }}>
                {postUser}
              </Typography>
            </Box>
            {!isOwnPost && (
              <Button size="small" variant="outlined" onClick={handleOpenDM} sx={{ borderRadius: radius.md, textTransform: 'none' }}>
                Open DM
              </Button>
            )}
            <PostActionsMenu
              onReport={onReport}
              showReport={!isOwnPost}
              showBlock={!isOwnPost}
              blocked={isBlocked}
              onBlock={handleBlockToggle}
            />
          </Box>
        </Box>

        {post.previewUrl && (
          <Box sx={{ mb: 2 }}>
            <img
              src={post.previewUrl}
              alt="Art Preview"
              style={{
                maxWidth: '100%', borderRadius: radius.sm, maxHeight: '350px', objectFit: 'contain',
              }}
            />
          </Box>
        )}

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
                  display: 'flex', gap: 2, alignItems: 'flex-start', p: 1.5, bgcolor: 'surface.sunken', borderRadius: radius.md,
                }}
              >
                <Typography variant="body2" sx={{ flex: 1, color: 'text.primary' }}>
                  {comment.text}
                </Typography>
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
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: radius.md } }}
          />
          <Button variant="contained" disableElevation sx={{ borderRadius: radius.md, textTransform: 'none' }}>
            Send
          </Button>
        </Box>

        {post.status === 'COMPLETED' && receivedUrl && (
          <Box sx={{
            mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider',
          }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Art Received:
            </Typography>
            <Box sx={{
              bgcolor: 'surface.sunken', borderRadius: radius.sm, p: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            >
              <img
                src={receivedUrl}
                alt="Received Art"
                style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
              />
            </Box>
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={downloadingFull ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
              onClick={() => handleDownloadFull(receivedUrl)}
              disabled={downloadingFull}
              sx={{ mt: 1.5 }}
            >
              {downloadingFull ? 'Saving File...' : 'Download Art Received'}
            </Button>
          </Box>
        )}

        {/* Request to Trade + Offer Art buttons */}
        {!isOwnPost && post.status === 'OPEN' && (
          <Box sx={{
            mt: 2,
            pt: 2,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            flexWrap: 'wrap',
          }}
          >
            <RequestTradeButton
              postId={post.id}
              myRequest={myTradeRequests}
              onRequestChanged={onTradeActivity}
            />
            <ArtTradeOffer postId={post.id} onSuccess={onOfferSubmitted} />
          </Box>
        )}

        {/* Owner's view of incoming requests on their own open post */}
        {isOwnPost && post.status === 'OPEN' && (
          <IncomingTradeRequests postId={post.id} onAccepted={onTradeActivity} />
        )}
      </CardContent>
    </Card>
  );
}
