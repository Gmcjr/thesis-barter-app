/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useState } from 'react';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import DownloadIcon from '@mui/icons-material/Download';

import type { PostData } from './ManagePosts';
import { radius } from '../../theme';

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
  const [downloadingFull, setDownloadingFull] = useState(false);

  const completedOffer = post.tradeOffers?.find((o) => o.status === 'COMPLETED');

  if (!completedOffer || post.status !== 'COMPLETED') return null;

  const isOfferer = userId !== undefined
  && completedOffer.offererId === userId;

  const isParticipant = isOwnPost || isOfferer;

  const sentUrl = isOfferer
    ? completedOffer.previewUrl ?? undefined
    : post.previewUrl ?? undefined;

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
              bgcolor: 'surface.sunken', borderRadius: radius.lg, p: 1, textAlign: 'center', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            >
              {sentUrl ? (
                <img
                  src={sentUrl}
                  alt="Traded Away"
                  loading="lazy"
                  decoding="async"
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
              bgcolor: 'surface.sunken', borderRadius: radius.lg, p: 1, textAlign: 'center', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            >
              {receivedUrl ? (
                <img
                  src={receivedUrl}
                  alt="Received Art"
                  loading="lazy"
                  decoding="async"
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
            bgcolor: 'surface.sunken', borderRadius: radius.lg, p: 2, textAlign: 'left',
          }}
          >
            <Typography variant="body2" color="text.primary">
              {(completedOffer as { message?: string })?.message || post.message || 'Trade successfully completed between users.'}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
