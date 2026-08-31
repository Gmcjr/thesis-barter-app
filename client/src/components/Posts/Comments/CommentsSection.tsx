import React, { useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useRouter } from '../../../context/RouterContext';
import { radius } from '../../../theme';
import ConfirmDialog from '../../common/ConfirmDialog';
import CommentItem from './CommentItem';
import type { CommentData } from './types';

interface CommentsSectionProps {
  postId: number;
  comments: CommentData[];
  defaultExpanded?: boolean;
}

export default function CommentsSection({
  postId, comments, defaultExpanded = true,
}: CommentsSectionProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { navigate } = useRouter();

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [commentDraft, setCommentDraft] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleAddComment = async () => {
    const text = commentDraft.trim();
    if (!text) return;
    setSubmittingComment(true);
    try {
      await axios.post('/comments', { postId, text }, { withCredentials: true });
      // The new comment shows up via the posts:changed refresh triggered server-side.
      setCommentDraft('');
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Could not add comment - try again.';
      showToast(message, 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (confirmDeleteId === null) return;
    const commentId = confirmDeleteId;
    setDeletingCommentId(commentId);
    try {
      await axios.delete(`/comments/${commentId}`, { withCredentials: true });
    } catch {
      showToast('Could not delete comment - try again.', 'error');
    } finally {
      setDeletingCommentId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box
        onClick={() => setExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={expanded ? 'Collapse comments' : 'Expand comments'}
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.25, cursor: 'pointer', mb: expanded ? 1.5 : 0, userSelect: 'none', width: 'fit-content',
        }}
      >
        <ExpandMoreIcon
          fontSize="small"
          sx={{
            color: 'text.secondary',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.15s ease',
          }}
        />
        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          {`Comments${comments.length > 0 ? ` (${comments.length})` : ''}`}
        </Typography>
      </Box>

      {expanded && (
        <>
          {comments.length > 0 ? (
            <Box sx={{
              display: 'flex', flexDirection: 'column', gap: 1, mb: 2,
            }}
            >
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  canDelete={comment.userId === user?.id}
                  deleting={deletingCommentId === comment.id}
                  onNavigateToProfile={(userId) => navigate(`/profile/${userId}`)}
                  onRequestDelete={setConfirmDeleteId}
                />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.disabled" sx={{ mb: 2, fontStyle: 'italic' }}>
              No comments...
            </Typography>
          )}

          {user && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Add a comment..."
                variant="outlined"
                value={commentDraft}
                disabled={submittingComment}
                onChange={(e) => setCommentDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: radius.md } }}
              />
              <Button
                variant="contained"
                disableElevation
                disabled={submittingComment || !commentDraft.trim()}
                onClick={handleAddComment}
                sx={{ borderRadius: radius.md, textTransform: 'none' }}
              >
                {submittingComment ? <CircularProgress size={18} color="inherit" /> : 'Send'}
              </Button>
            </Box>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete comment?"
        message="This will permanently delete your comment. This can't be undone."
        confirmLabel="Delete"
        loading={deletingCommentId !== null}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </Box>
  );
}
