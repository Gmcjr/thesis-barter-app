/* eslint-disable max-len */
import React, { useState } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseIcon from '@mui/icons-material/Close';

import type { PostData } from './ManagePosts';
import { radius } from '../../theme';

interface PostImageGalleryProps {
  post: PostData;
  isArtTrade: boolean;
}

export default function PostImageGallery({
  post,
  isArtTrade,
}: PostImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  const postImages = post.imageUrls ?? [];
  const currentPostImage = postImages[currentImageIndex] ?? postImages[0];
  const feedDigitalImage = post.previewUrl ?? null;

  const expandedImageUrl = isArtTrade
    ? post.fullUrl ?? post.previewUrl
    : currentPostImage;

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

  return (
    <>
      {currentPostImage && (
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: { xs: 280, sm: 400 },
            bgcolor: 'surface.sunken',
            borderRadius: radius.md,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={currentPostImage}
            alt={`Post ${currentImageIndex + 1}`}
            loading="lazy"
            decoding="async"
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
                  borderRadius: radius.pill,
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
                  borderRadius: radius.sm,
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
                  loading="lazy"
                  decoding="async"
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

      {feedDigitalImage && (
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: { xs: 280, sm: 400 },
              bgcolor: 'surface.sunken',
              borderRadius: radius.md,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={feedDigitalImage}
              alt="Post Preview"
              loading="lazy"
              decoding="async"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />

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
        </Box>
      )}

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
              borderRadius: radius.md,
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

          {expandedImageUrl && (
            <img
              src={expandedImageUrl}
              alt={`Expanded Post ${currentImageIndex + 1}`}
              decoding="async"
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
