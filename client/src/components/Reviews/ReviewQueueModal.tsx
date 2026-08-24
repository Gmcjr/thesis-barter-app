import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Rating from '@mui/material/Rating';
import { useTheme } from '@mui/material/styles';

import ReviewFormModal, { type ReviewData } from './ReviewFormModal';

export interface MyCompletedTrade {
  id: number;
  status: string;
  ownerId: number;
  requesterId: number;
  post: { id: number; title: string };
  owner: { id: number; name: string | null };
  requester: { id: number; name: string | null };
}

interface ReviewQueueModalProps {
  open: boolean;
  onClose: () => void;
  trades: MyCompletedTrade[];
  myReviews: ReviewData[];
  currentUserId: number;
  onReviewSaved: (review: ReviewData) => void;
}

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export default function ReviewQueueModal({
  open, onClose, trades, myReviews, currentUserId, onReviewSaved,
}: ReviewQueueModalProps) {
  const theme = useTheme();
  const [activeTrade, setActiveTrade] = useState<MyCompletedTrade | null>(null);
  const reviewForTrade = (tradeId: number) => myReviews.find((r) => r.tradeId === tradeId);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>Trades Ready for Review</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {trades.map((trade) => {
              const existing = reviewForTrade(trade.id);
              const otherParty = trade.ownerId === currentUserId ? trade.requester : trade.owner;
              const canEdit = existing
                && (Date.now() - new Date(existing.createdAt).getTime()) < EDIT_WINDOW_MS;

              return (
                <Box
                  key={trade.id}
                  sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: theme.radius.lg, gap: 1,
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{trade.post.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      traded with
                      {' '}
                      {otherParty.name ?? 'Unknown'}
                    </Typography>
                  </Box>
                  {existing ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={existing.rating} readOnly size="small" />
                      {canEdit && <Button size="small" onClick={() => setActiveTrade(trade)}>Edit</Button>}
                    </Box>
                  ) : (
                    <Button size="small" variant="contained" onClick={() => setActiveTrade(trade)}>
                      Leave a Review
                    </Button>
                  )}
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {activeTrade && (
        <ReviewFormModal
          open={Boolean(activeTrade)}
          onClose={() => setActiveTrade(null)}
          tradeId={activeTrade.id}
          otherPartyName={(activeTrade.ownerId === currentUserId ? activeTrade.requester : activeTrade.owner).name ?? 'this user'}
          postTitle={activeTrade.post.title}
          existingReview={reviewForTrade(activeTrade.id) ?? null}
          onSuccess={(review) => { onReviewSaved(review); setActiveTrade(null); }}
        />
      )}
    </>
  );
}
