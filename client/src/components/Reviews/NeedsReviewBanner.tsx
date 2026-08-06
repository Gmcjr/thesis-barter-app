import React, { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import ReviewQueueModal, { type MyCompletedTrade } from './ReviewQueueModal';
import type { ReviewData } from './ReviewFormModal';

const dismissedKey = (userId: number) => `barta:dismissedReviewPrompts:${userId}`;

const loadDismissed = (userId: number): number[] => {
  try {
    const raw = localStorage.getItem(dismissedKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveDismissed = (userId: number, ids: number[]) => {
  try { localStorage.setItem(dismissedKey(userId), JSON.stringify(ids)); } catch { /* ignore */ }
};

interface NeedsReviewBannerProps {
  currentUserId: number;
  trades: MyCompletedTrade[];
  myReviews: ReviewData[];
  onReviewSaved: (review: ReviewData) => void;
}

export default function NeedsReviewBanner({
  currentUserId, trades, myReviews, onReviewSaved,
}: NeedsReviewBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<number[]>(() => loadDismissed(currentUserId));
  const [modalOpen, setModalOpen] = useState(false);

  const reviewedTradeIds = new Set(myReviews.map((r) => r.tradeId));
  const unreviewed = trades.filter((t) => !reviewedTradeIds.has(t.id));
  const actionable = unreviewed.filter((t) => !dismissedIds.includes(t.id));

  const handleDismiss = () => {
    const next = [...dismissedIds, ...actionable.map((t) => t.id)];
    setDismissedIds(next);
    saveDismissed(currentUserId, next);
  };

  if (actionable.length === 0) return null;

  return (
    <>
      <Alert
        severity="info"
        action={(
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Button color="inherit" size="small" onClick={() => setModalOpen(true)}>
              Review Now
            </Button>
            <IconButton color="inherit" size="small" onClick={handleDismiss} aria-label="Dismiss">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        sx={{ mb: 3 }}
      >
        {`You have ${actionable.length} completed trade${actionable.length === 1 ? '' : 's'} ready for review.`}
      </Alert>

      <ReviewQueueModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        trades={actionable}
        myReviews={myReviews}
        currentUserId={currentUserId}
        onReviewSaved={onReviewSaved}
      />
    </>
  );
}
