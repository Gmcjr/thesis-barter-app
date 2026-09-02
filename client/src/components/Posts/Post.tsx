/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useState } from 'react';
import axios from 'axios';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { useTheme } from '@mui/material/styles';
import Divider from '@mui/material/Divider';

import { formatPostDate } from '../../utils/utils';
import type { PostData, PostUpdateData } from './ManagePosts';

import UserAvatar from '../common/UserAvatar';
import PostActionsMenu from './PostActionsMenu';
import CommentsSection from './Comments/CommentsSection';
import PostEdit from './PostEdit';
import PostImageGallery from './PostImageGallery';
import PostCompletedTrade from './PostCompletedTrade';
import ArtTradeOffer from './ArtTradeOffer';
import type { TradeRequestData } from '../Trades/RequestTradeButton';
import RequestTradeButton from '../Trades/RequestTradeButton';
import IncomingTradeRequests from '../Trades/IncomingTradeRequests';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useRouter } from '../../context/RouterContext';

interface PostProps {
  post: PostData;
  onReport: () => void;
  myTradeRequests: TradeRequestData | null;
  myArtTradeOffer: {
    id: number;
    postId: number;
    status: string;
  } | null;
  onTradeActivity: () => void | Promise<void>;
  onOfferSubmitted?: () => void;
  onUpdate?: (postId: number, postData: PostUpdateData) => Promise<void>;
  onDelete?: (postId: number) => Promise<void>;
  highlight?: boolean;
}

export default function Post({
  post, onReport, myTradeRequests, myArtTradeOffer, onTradeActivity, onOfferSubmitted,
  onUpdate, onDelete, highlight,
}: PostProps) {
  const theme = useTheme();
  const postUser = post.user.name ?? post.user.email;
  const {
    user, blockedUserIds, blockUser, unblockUser,
  } = useAuth();
  const { showToast } = useToast();
  const { navigate } = useRouter();
  const isOwnPost = user?.id === post.userId;
  const isBlocked = blockedUserIds.includes(post.userId);
  const [editing, setEditing] = useState(false);
  const [offerTypeOpen, setOfferTypeOpen] = useState(false);
  const [requestTradeOpen, setRequestTradeOpen] = useState(false);
  const [artTradeOpen, setArtTradeOpen] = useState(false);
  const [withdrawingArtTrade, setWithdrawingArtTrade] = useState(false);

  const isArtTrade = Boolean(post.previewUrl || post.fullUrl);
  const hasPendingRequest = myTradeRequests?.status === 'PENDING';
  const hasPendingArtOffer = myArtTradeOffer?.status === 'PENDING';

  const handleDeletePost = async () => {
    if (!onDelete) return;

    try {
      await onDelete(post.id);
    } catch (error) {
      console.error('Failed to delete post:', error);
      showToast('Failed to delete post', 'error');
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

  const handleOfferTradeClick = () => {
    if (!user) {
      showToast('To offer trades, sign in', 'info');
      return;
    }

    setOfferTypeOpen(true);
  };

  const handleRequestTrade = () => {
    setOfferTypeOpen(false);
    setRequestTradeOpen(true);
  };

  const handleArtTrade = () => {
    setOfferTypeOpen(false);
    setArtTradeOpen(true);
  };

  const handleWithdrawArtTrade = async () => {
    if (!myArtTradeOffer) return;

    setWithdrawingArtTrade(true);

    try {
      await axios.patch(
        `/artTradeOffers/${myArtTradeOffer.id}/cancel`,
        {},
        { withCredentials: true },
      );
      showToast('Trade offer withdrawn.', 'info');
      await onTradeActivity();
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Could not withdraw trade offer - try again.';
      showToast(message, 'error');
    } finally {
      setWithdrawingArtTrade(false);
    }
  };

  return (
    <Card
      id={`post-${post.id}`}
      variant="outlined"
      sx={{
        width: '100%',
        minWidth: 0,
        containerType: 'inline-size',
        borderRadius: theme.radius.md,
        borderColor: 'border.default',
        ...(highlight && { outline: '2px solid', outlineColor: 'primary.main' }),
      }}
    >
      <CardContent
        sx={{
          p: 'clamp(8px, 2cqw, 16px)',
          '&:last-child': {
            pb: 'clamp(8px, 2cqw, 16px)',
          },
        }}
      >
        {editing ? (
          <PostEdit
            post={post}
            postUser={postUser}
            onUpdate={onUpdate}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 'clamp(5px, 1cqw, 10px)',
                gap: 'clamp(6px, 1.5cqw, 14px)',
                minWidth: 0,
              }}
            >
              {/* title, date, "Trade Complete" chip */}
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'baseline',
                    flexWrap: 'nowrap',
                    gap: 'clamp(4px, 1cqw, 10px)',
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      wordBreak: 'break-word',
                      fontSize: 'clamp(0.8rem, 2.4cqw, 1.5rem)',
                      lineHeight: 1.2,
                    }}
                  >
                    {post.title}
                  </Typography>

                  {post.status === 'COMPLETED' && (
                    <Chip
                      size="small"
                      color="success"
                      label="Trade Completed"
                      sx={{
                        height: 'clamp(18px, 3.2cqw, 24px)',
                        fontSize: 'clamp(0.5rem, 1.25cqw, 0.75rem)',
                        '& .MuiChip-label': {
                          px: 'clamp(4px, 1cqw, 8px)',
                        },
                      }}
                    />
                  )}
                </Box>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: 'clamp(0.5rem, 1.35cqw, 0.75rem)',
                    lineHeight: 1.2,
                  }}
                >
                  {((post.updatedAt && post.updatedAt !== post.createdAt) && `Updated on ${formatPostDate(post.updatedAt)}`) || `Posted on ${formatPostDate(post.createdAt)}`}
                </Typography>
              </Box>

              {/* user avatar, name, DM button and report modal */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(4px, 1cqw, 8px)',
                  flexShrink: 0,
                  flexWrap: 'nowrap',
                  minWidth: 0,
                }}
              >
                <Box
                  onClick={() => navigate(`/profile/${post.user.id}`)}
                  role="button"
                  tabIndex={0}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(4px, 1cqw, 8px)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    '&:hover .post-username': { textDecoration: 'underline' },
                  }}
                >
                  <UserAvatar
                    user={post.user}
                    sx={{
                      width: 'clamp(20px, 4cqw, 32px)',
                      height: 'clamp(20px, 4cqw, 32px)',
                      fontSize: 'clamp(0.55rem, 1.5cqw, 0.9rem)',
                      flexShrink: 0,
                    }}
                  />

                  <Typography
                    variant="subtitle2"
                    className="post-username"
                    sx={{
                      whiteSpace: 'nowrap',
                      fontSize: 'clamp(0.55rem, 1.55cqw, 0.875rem)',
                      lineHeight: 1.2,
                    }}
                  >
                    {postUser}
                  </Typography>
                </Box>

                {!isOwnPost && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleOpenDM}
                    sx={{
                      borderRadius: theme.radius.md,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                      px: 'clamp(4px, 1.2cqw, 10px)',
                      py: 'clamp(2px, 0.5cqw, 4px)',
                      fontSize: 'clamp(0.5rem, 1.35cqw, 0.8rem)',
                    }}
                  >
                    Open DM
                  </Button>
                )}

                <PostActionsMenu
                  onReport={onReport}
                  showReport={!isOwnPost}
                  showBlock={!isOwnPost}
                  blocked={isBlocked}
                  onBlock={handleBlockToggle}
                  showManage={isOwnPost}
                  onEdit={() => setEditing(true)}
                  onDeletePost={handleDeletePost}
                />
              </Box>
            </Box>

            <PostImageGallery post={post} isArtTrade={isArtTrade} />

            <Typography
              variant="body1"
              sx={{
                mb: 'clamp(6px, 1.4cqw, 12px)',
                lineHeight: 1.4,
                fontSize: 'clamp(0.65rem, 1.9cqw, 1rem)',
              }}
            >
              {post.message}
            </Typography>
          </>
        )}

        <Divider sx={{ mb: 'clamp(5px, 1.2cqw, 10px)' }} />

        <Typography
          variant="subtitle2"
          sx={{
            mb: 'clamp(3px, 0.7cqw, 6px)',
            color: 'text.secondary',
            fontSize: 'clamp(0.55rem, 1.5cqw, 0.875rem)',
          }}
        >
          Comments
        </Typography>

        {post.comments.length > 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(4px, 0.8cqw, 8px)',
            }}
          >
            {post.comments.map((comment) => (
              <Box
                key={comment.id}
                sx={{
                  display: 'flex',
                  gap: 'clamp(6px, 1.4cqw, 12px)',
                  alignItems: 'flex-start',
                  p: 'clamp(5px, 1.2cqw, 10px)',
                  bgcolor: 'surface.sunken',
                  borderRadius: theme.radius.md,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    color: 'text.primary',
                    fontSize: 'clamp(0.55rem, 1.5cqw, 0.875rem)',
                  }}
                >
                  {comment.text}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{
              mb: 'clamp(4px, 0.9cqw, 8px)',
              fontStyle: 'italic',
              fontSize: 'clamp(0.55rem, 1.5cqw, 0.875rem)',
            }}
          >
            No comments...
          </Typography>
        )}

        <CommentsSection postId={post.id} comments={post.comments} />

        <PostCompletedTrade
          post={post}
          isArtTrade={isArtTrade}
          isOwnPost={isOwnPost}
          userId={user?.id}
        />

        {/* Request to Trade + Offer buttons */}
        {!isOwnPost && post.status === 'OPEN' && (
          <Box
            sx={{
              mt: 'clamp(5px, 1.2cqw, 10px)',
              pt: 'clamp(5px, 1.2cqw, 10px)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            {hasPendingRequest && (
              <RequestTradeButton
                postId={post.id}
                myRequest={myTradeRequests}
                onRequestChanged={onTradeActivity}
              />
            )}

            {!hasPendingRequest && hasPendingArtOffer && (
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                disabled={withdrawingArtTrade}
                onClick={handleWithdrawArtTrade}
                sx={{
                  borderRadius: theme.radius.md,
                  textTransform: 'none',
                }}
              >
                {withdrawingArtTrade ? 'Withdrawing...' : 'Withdraw Offer'}
              </Button>
            )}

            {!hasPendingRequest && !hasPendingArtOffer && (
              <Button
                variant="contained"
                onClick={handleOfferTradeClick}
                sx={{
                  borderRadius: theme.radius.md,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                  px: 'clamp(6px, 1.5cqw, 12px)',
                  py: 'clamp(3px, 0.7cqw, 6px)',
                  fontSize: 'clamp(0.55rem, 1.45cqw, 0.875rem)',
                }}
              >
                Offer Trade
              </Button>
            )}

            <Dialog
              open={offerTypeOpen}
              onClose={() => setOfferTypeOpen(false)}
              maxWidth="xs"
              fullWidth
            >
              <DialogTitle>What would you like to offer?</DialogTitle>

              <DialogContent>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    pt: 1,
                  }}
                >
                  <Button variant="outlined" onClick={handleRequestTrade}>
                    Service
                  </Button>

                  <Button variant="outlined" onClick={handleRequestTrade}>
                    Item
                  </Button>

                  <Button variant="outlined" onClick={handleArtTrade}>
                    Digital Art
                  </Button>
                </Box>
              </DialogContent>
            </Dialog>

            {!hasPendingRequest && !hasPendingArtOffer && (
              <RequestTradeButton
                postId={post.id}
                myRequest={myTradeRequests}
                onRequestChanged={onTradeActivity}
                open={requestTradeOpen}
                onClose={() => setRequestTradeOpen(false)}
                hideButton
              />
            )}

            {!hasPendingRequest && !hasPendingArtOffer && (
              <ArtTradeOffer
                postId={post.id}
                onSuccess={onOfferSubmitted}
                open={artTradeOpen}
                onClose={() => setArtTradeOpen(false)}
                hideButton
              />
            )}
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
