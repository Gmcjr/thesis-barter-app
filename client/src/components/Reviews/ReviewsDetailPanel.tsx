import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Rating from '@mui/material/Rating';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';

import { formatPostDate } from '../../utils/utils';
import ReviewQueueModal, { type MyCompletedTrade } from './ReviewQueueModal';
import type { ReviewData } from './ReviewFormModal';

export interface ReceivedReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: number; name: string | null };
}

interface ReviewsDetailPanelProps {
  reviews: ReceivedReview[];
  isOwnProfile: boolean;
  PendingTradeOffers: MyCompletedTrade[];
  myReviews: ReviewData[];
  currentUserId?: number;
  onReviewSaved: (review: ReviewData) => void;
  highlightReviewId?: number;
}

export default function ReviewsDetailPanel({
  reviews, isOwnProfile, PendingTradeOffers, myReviews, currentUserId, onReviewSaved,
  highlightReviewId,
}: ReviewsDetailPanelProps) {
  const theme = useTheme();
  const [queueOpen, setQueueOpen] = useState(false);
  const reviewedTradeIds = new Set(myReviews.map((r) => r.tradeId));
  const unreviewed = PendingTradeOffers.filter((t) => !reviewedTradeIds.has(t.id));
  const highlightMissing = !!highlightReviewId && !reviews.some((r) => r.id === highlightReviewId);

  useEffect(() => {
    if (!highlightReviewId) return;
    document.getElementById(`review-${highlightReviewId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightReviewId, reviews]);

  return (
    <>
      {isOwnProfile && unreviewed.length > 0 && (
        <>
          <Box sx={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: theme.radius.lg, mb: 2,
          }}
          >
            <Typography variant="body2">
              {`${unreviewed.length} completed trade${unreviewed.length === 1 ? '' : 's'} awaiting your review`}
            </Typography>
            <Button size="small" variant="contained" onClick={() => setQueueOpen(true)}>
              Review
            </Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
        </>
      )}

      {highlightMissing && (
        <Alert severity="info" sx={{ mb: 1.5 }}>This review is no longer available.</Alert>
      )}

      {reviews.length === 0 ? (
        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
          No reviews yet.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {reviews.map((review) => (
            <Box
              key={review.id}
              id={`review-${review.id}`}
              sx={{
                display: 'flex',
                gap: 1.5,
                ...(review.id === highlightReviewId && { outline: '2px solid', outlineColor: 'primary.main' }),
              }}
            >
              <Avatar sx={{
                width: 32, height: 32, fontSize: '0.9rem', bgcolor: 'primary.main',
              }}
              >
                {(review.reviewer.name ?? '?').charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">{review.reviewer.name ?? 'Unknown'}</Typography>
                  <Rating value={review.rating} readOnly size="small" />
                </Box>
                <Typography variant="caption" color="text.secondary">{formatPostDate(review.createdAt)}</Typography>
                {review.comment && <Typography variant="body2" sx={{ mt: 0.5 }}>{review.comment}</Typography>}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {isOwnProfile && currentUserId !== undefined && (
        <ReviewQueueModal
          open={queueOpen}
          onClose={() => setQueueOpen(false)}
          trades={unreviewed}
          myReviews={myReviews}
          currentUserId={currentUserId}
          onReviewSaved={onReviewSaved}
        />
      )}
    </>
  );
}
