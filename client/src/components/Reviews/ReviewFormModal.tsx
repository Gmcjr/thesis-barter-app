import React, { useState } from 'react';
import axios from 'axios';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Rating from '@mui/material/Rating';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

export interface ReviewData {
  id: number;
  tradeId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface ReviewFormModalProps {
  open: boolean;
  onClose: () => void;
  tradeId: number;
  otherPartyName: string;
  postTitle: string;
  existingReview?: ReviewData | null;
  onSuccess: (review: ReviewData) => void;
}

export default function ReviewFormModal({
  open, onClose, tradeId, otherPartyName, postTitle, existingReview, onSuccess,
}: ReviewFormModalProps) {
  const isEditing = Boolean(existingReview);
  const [rating, setRating] = useState<number | null>(existingReview?.rating ?? null);
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (isSubmitting) return;
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please select a star rating.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const trimmedComment = comment.trim() || undefined;

      const res = isEditing
        ? await axios.patch(`/reviews/${existingReview!.id}`, { rating, comment: trimmedComment })
        : await axios.post('/reviews', { tradeId, rating, comment: trimmedComment });

      onSuccess(res.data);
      onClose();
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Could not submit review - please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubmitButtonContent = () => {
    if (isSubmitting) return <CircularProgress size={24} />;
    return isEditing ? 'Save Changes' : 'Submit Review';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Your Review' : 'Leave a Review'}
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {postTitle}
            · traded with
            {otherPartyName}
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Rating</Typography>
            <Rating
              value={rating}
              onChange={(_e, newValue) => setRating(newValue)}
              size="large"
              disabled={isSubmitting}
            />
          </Box>

          <TextField
            label="Comment (optional)"
            multiline
            rows={3}
            fullWidth
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting || !rating}
        >
          {getSubmitButtonContent()}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
