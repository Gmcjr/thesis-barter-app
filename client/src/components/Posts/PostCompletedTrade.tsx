/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useState } from 'react';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import DownloadIcon from '@mui/icons-material/Download';
import { useTheme } from '@mui/material/styles';

import type { PostData } from './ManagePosts';

interface PostCompletedTradeProps {
  post: PostData;
  isArtTrade: boolean;
  isOwnPost: boolean;
  userId?: number;
}

export default function PostCompletedTrade({
  post,
  isArtTrade,
  isOwnPost,
  userId,
}: PostCompletedTradeProps) {
  const theme = useTheme();
  const [downloadingFull, setDownloadingFull] = useState(false);

  const completedOffer = post.tradeOffers?.find((o) => o.status === 'COMPLETED');

  if (!completedOffer || post.status !== 'COMPLETED') return null;

  const isOfferer = userId !== undefined
  && completedOffer.offererId === userId;

  const isParticipant = isOwnPost || isOfferer;

  const sentUrl = isOfferer
    ? completedOffer.fullUrl ?? completedOffer.previewUrl ?? undefined
    : post.fullUrl ?? post.previewUrl ?? undefined;

  let receivedUrl = completedOffer.previewUrl ?? undefined;

  if (isOwnPost) {
    receivedUrl = completedOffer.fullUrl ?? undefined;
  } else if (isOfferer) {
    receivedUrl = post.fullUrl ?? undefined;
  }

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

  return (
    <Box
      sx={{
        mt: 'clamp(6px, 1.5cqw, 12px)',
        pt: 'clamp(6px, 1.5cqw, 12px)',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      {isArtTrade ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 'clamp(6px, 1.5cqw, 14px)',
            width: '100%',
          }}
        >
          {/* Art Sent */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 'clamp(3px, 0.7cqw, 6px)',
                fontWeight: 'bold',
                fontSize: 'clamp(0.55rem, 1.5cqw, 0.875rem)',
              }}
            >
              Art Sent:
            </Typography>

            <Box
              sx={{
                width: '100%',
                aspectRatio: '2.8 / 1',
                bgcolor: 'surface.sunken',
                borderRadius: theme.radius.lg,
                p: 'clamp(3px, 0.7cqw, 6px)',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {sentUrl ? (
                <img
                  src={sentUrl}
                  alt="Traded Away"
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: 'clamp(0.45rem, 1.2cqw, 0.75rem)',
                  }}
                >
                  No image available
                </Typography>
              )}
            </Box>
          </Box>

          {/* Art Received */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                mb: 'clamp(3px, 0.7cqw, 6px)',
                fontWeight: 'bold',
                fontSize: 'clamp(0.55rem, 1.5cqw, 0.875rem)',
              }}
            >
              Art Received:
            </Typography>

            <Box
              sx={{
                width: '100%',
                aspectRatio: '2.8 / 1',
                bgcolor: 'surface.sunken',
                borderRadius: theme.radius.lg,
                p: 'clamp(3px, 0.7cqw, 6px)',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {receivedUrl ? (
                <img
                  src={receivedUrl}
                  alt="Received Art"
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: 'clamp(0.45rem, 1.2cqw, 0.75rem)',
                  }}
                >
                  No image available
                </Typography>
              )}
            </Box>

            {receivedUrl && isParticipant && (
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={downloadingFull
                  ? <CircularProgress size={16} color="inherit" />
                  : <DownloadIcon />}
                onClick={() => handleDownloadFull(receivedUrl)}
                disabled={downloadingFull}
                sx={{
                  mt: 'clamp(4px, 1cqw, 8px)',
                  alignSelf: 'flex-start',
                  minWidth: 0,
                  px: 'clamp(5px, 1.2cqw, 10px)',
                  py: 'clamp(2px, 0.5cqw, 4px)',
                  fontSize: 'clamp(0.5rem, 1.35cqw, 0.8125rem)',
                  '& .MuiSvgIcon-root': {
                    fontSize: 'clamp(13px, 2cqw, 20px)',
                  },
                }}
              >
                {downloadingFull ? 'Saving File...' : 'Download Art Received'}
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              mb: 'clamp(3px, 0.7cqw, 6px)',
              fontWeight: 'bold',
              fontSize: 'clamp(0.55rem, 1.5cqw, 0.875rem)',
            }}
          >
            Trade Details & Summary:
          </Typography>

          <Box
            sx={{
              bgcolor: 'surface.sunken',
              borderRadius: theme.radius.lg,
              p: 'clamp(6px, 1.5cqw, 12px)',
              textAlign: 'left',
            }}
          >
            <Typography
              variant="body2"
              color="text.primary"
              sx={{
                fontSize: 'clamp(0.55rem, 1.5cqw, 0.875rem)',
                lineHeight: 1.4,
              }}
            >
              {(completedOffer as { message?: string })?.message || post.message || 'Trade successfully completed between users.'}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
