/* eslint-disable max-len */
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
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';

import { formatPostDate } from '../../utils/utils';
import type { PostData, PostUpdateData } from './ManagePosts';

import PostActionsMenu from './PostActionsMenu';
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
  onTradeActivity: () => void | Promise<void>;
  onOfferSubmitted?: () => void;
  onUpdate?: (postId: number, postData: PostUpdateData) => Promise<void>;
  onDelete?: (postId: number) => Promise<void>;
  onComplete?: (tradeId: number) => Promise<void>;
  highlight?: boolean;
}

export default function Post({
  post, onReport, myTradeRequests, onTradeActivity, onOfferSubmitted,
  onUpdate, onDelete, onComplete, highlight,
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
  const [downloadingFull, setDownloadingFull] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  const isArtTrade = Boolean(post.previewUrl || post.fullUrl);

  const postImages = post.imageUrls ?? [];
  const currentPostImage = postImages[currentImageIndex] ?? postImages[0];

  const completedOffer = post.tradeOffers?.find((o) => o.status === 'COMPLETED');

  // determine whether the current user participated in the completed trade
  const isOfferer = user?.id !== undefined
  && completedOffer?.offererId === user.id;

  const isParticipant = isOwnPost || isOfferer;

  // the offerer sent the offer art;
  // everyone else sees the original post art as the sent art
  const sentUrl = isOfferer
    ? completedOffer?.previewUrl ?? undefined
    : post.previewUrl ?? undefined;

  // third parties see only the offer preview
  let receivedUrl = completedOffer?.previewUrl ?? undefined;

  if (isOwnPost) {
    receivedUrl = completedOffer?.fullUrl ?? undefined;
  } else if (isOfferer) {
    receivedUrl = post.fullUrl ?? undefined;
  }

  const handlePreviousImage = () => {
    setCurrentImageIndex((currentIndex) => (
      currentIndex === 0 ? postImages.length - 1 : currentIndex - 1
    ));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((currentIndex) => (
      currentIndex === postImages.length - 1 ? 0 : currentIndex + 1
    ));
  };

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
    <>
      <Card
        id={`post-${post.id}`}
        variant="outlined"
        sx={{
          borderRadius: theme.radius.md,
          borderColor: 'border.default',
          ...(highlight && { outline: '2px solid', outlineColor: 'primary.main' }),
        }}
      >
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
                <Typography variant="h5" sx={{ wordBreak: 'break-word' }}>
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
                <Typography variant="subtitle2" className="post-username">
                  {postUser}
                </Typography>
              </Box>
              {!isOwnPost && (
              <Button size="small" variant="outlined" onClick={handleOpenDM} sx={{ borderRadius: theme.radius.md, textTransform: 'none' }}>
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
                managePosts={[post]}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onComplete={onComplete}
              />
            </Box>
          </Box>

          {currentPostImage && (
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: { xs: 280, sm: 400 },
                bgcolor: 'surface.sunken',
                borderRadius: theme.radius.md,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={currentPostImage}
                alt={`Post ${currentImageIndex + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />

              {postImages.length > 1 && (
              <>
                <IconButton
                  onClick={handlePreviousImage}
                  aria-label="Previous image"
                  sx={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    '&:hover': {
                      bgcolor: 'background.paper',
                    },
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>

                <IconButton
                  onClick={handleNextImage}
                  aria-label="Next image"
                  sx={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    '&:hover': {
                      bgcolor: 'background.paper',
                    },
                  }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </>
              )}

              <IconButton
                onClick={() => setImageViewerOpen(true)}
                aria-label="Expand image"
                sx={{
                  position: 'absolute',
                  right: 12,
                  bottom: 12,
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  '&:hover': {
                    bgcolor: 'background.paper',
                  },
                }}
              >
                <OpenInFullIcon />
              </IconButton>
            </Box>

            {postImages.length > 1 && (
            <>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 0.75,
                  mt: 1,
                }}
              >
                {postImages.map((imageUrl, index) => (
                  <Box
                    key={`dot-${imageUrl}`}
                    onClick={() => setCurrentImageIndex(index)}
                    sx={{
                      width: index === currentImageIndex ? 18 : 7,
                      height: 7,
                      borderRadius: theme.radius.pill,
                      bgcolor: index === currentImageIndex ? 'primary.main' : 'text.disabled',
                      cursor: 'pointer',
                      transition: 'width 0.2s ease',
                    }}
                  />
                ))}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 1,
                  mt: 1.5,
                  overflowX: 'auto',
                  pb: 0.5,
                }}
              >
                {postImages.map((imageUrl, index) => (
                  <Box
                    key={`thumbnail-${imageUrl}`}
                    onClick={() => setCurrentImageIndex(index)}
                    role="button"
                    tabIndex={0}
                    sx={{
                      width: 72,
                      height: 72,
                      flexShrink: 0,
                      borderRadius: theme.radius.sm,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: index === currentImageIndex ? 'primary.main' : 'border.default',
                      opacity: index === currentImageIndex ? 1 : 0.7,
                      transition: 'opacity 0.15s ease, border-color 0.15s ease',
                      '&:hover': {
                        opacity: 1,
                      },
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={`Post Thumbnail ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </>
            )}
          </Box>
          )}

          {post.previewUrl && (
          <Box sx={{ mb: 2 }}>
            <img
              src={post.previewUrl}
              alt="Post Preview"
              style={{
                maxWidth: '100%', borderRadius: theme.radius.sm, maxHeight: '350px', objectFit: 'contain',
              }}
            />
          </Box>
          )}

          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
            {post.message}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
            Comments
          </Typography>

          {post.comments.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {post.comments.map((comment) => (
                <Box
                  key={comment.id}
                  sx={{
                    display: 'flex', gap: 2, alignItems: 'flex-start', p: 1.5, bgcolor: 'surface.sunken', borderRadius: theme.radius.md,
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
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: theme.radius.md } }}
            />
            <Button variant="contained" disableElevation sx={{ borderRadius: theme.radius.md, textTransform: 'none' }}>
              Send
            </Button>
          </Box>

          {/* Layout for Completed Trades (support for local and digital trades) */}
          {post.status === 'COMPLETED' && completedOffer && (
          <Box sx={{
            mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider',
          }}
          >
            {isArtTrade ? (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                {/* Art Sent */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Art Sent:
                  </Typography>
                  <Box sx={{
                    bgcolor: 'surface.sunken', borderRadius: theme.radius.lg, p: 1, textAlign: 'center', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  >
                    {sentUrl ? (
                      <img
                        src={sentUrl}
                        alt="Traded Away"
                        style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">No image available</Typography>
                    )}
                  </Box>
                </Box>

                {/* Art Received */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Art Received:
                  </Typography>
                  <Box sx={{
                    bgcolor: 'surface.sunken', borderRadius: theme.radius.lg, p: 1, textAlign: 'center', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  >
                    {receivedUrl ? (
                      <img
                        src={receivedUrl}
                        alt="Received Art"
                        style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">No image available</Typography>
                    )}
                  </Box>

                  {/* Only render download button for the poster and the user they trade with */}
                  {receivedUrl && isParticipant && (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={downloadingFull ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                    onClick={() => handleDownloadFull(receivedUrl)}
                    disabled={downloadingFull}
                    sx={{ mt: 1.5, alignSelf: 'flex-start' }}
                  >
                    {downloadingFull ? 'Saving File...' : 'Download Art Received'}
                  </Button>
                  )}
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Trade Details & Summary:
                </Typography>
                <Box sx={{
                  bgcolor: 'surface.sunken', borderRadius: theme.radius.lg, p: 2, textAlign: 'left',
                }}
                >
                  <Typography variant="body2" color="text.primary">
                    {(completedOffer as { message?: string })?.message || post.message || 'Trade successfully completed between users.'}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
          )}

          {/* Request to Trade + Offer buttons */}
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
            {isArtTrade ? (
              <ArtTradeOffer postId={post.id} onSuccess={onOfferSubmitted} />
            ) : (
              <Button variant="contained" onClick={onOfferSubmitted} sx={{ borderRadius: theme.radius.pill, textTransform: 'none' }}>
                Make Offer
              </Button>
            )}
          </Box>
          )}

          {/* Owner's view of incoming requests on their own open post */}
          {isOwnPost && post.status === 'OPEN' && (
          <IncomingTradeRequests postId={post.id} onAccepted={onTradeActivity} />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        maxWidth="xl"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              height: { xs: '90vh', md: '94vh' },
              maxHeight: '94vh',
              bgcolor: 'background.default',
              borderRadius: theme.radius.md,
            },
          },
        }}
      >
        <DialogContent
          sx={{
            position: 'relative',
            p: { xs: 1, sm: 2 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <IconButton
            onClick={() => setImageViewerOpen(false)}
            aria-label="Close image"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 2,
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'background.paper',
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          {postImages.length > 1 && (
          <IconButton
            onClick={handlePreviousImage}
            aria-label="Previous image"
            sx={{
              position: 'absolute',
              left: { xs: 8, sm: 20 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'background.paper',
              },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          )}

          {currentPostImage && (
          <img
            src={currentPostImage}
            alt={`Expanded Post ${currentImageIndex + 1}`}
            style={{
              maxWidth: '100%',
              maxHeight: 'calc(94vh - 48px)',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
          )}

          {postImages.length > 1 && (
          <IconButton
            onClick={handleNextImage}
            aria-label="Next image"
            sx={{
              position: 'absolute',
              right: { xs: 8, sm: 20 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              bgcolor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                bgcolor: 'background.paper',
              },
            }}
          >
            <ChevronRightIcon />
          </IconButton>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
