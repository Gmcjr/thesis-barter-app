/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

import WhyRemovedMenu from './WhyRemovedMenu';
import { formatPostDate } from '../../utils/utils';

export type PostStatus = 'OPEN' | 'ACCEPTED' | 'IN_PROGRESS' | 'WAITING_FOR_OTHER_USER' | 'COMPLETED' | 'CANCELLED';

export type PostData = {
  id: number;
  userId: number;
  title: string;
  message: string;
  isLocal: boolean;
  zipCode: string | null;
  radiusMiles: number | null;
  status: PostStatus;
  isRemoved: boolean;
  createdAt: string;
  updatedAt?: string;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
  comments: {
    id: number;
    text: string;
    userId: number;
  }[];
  trade: {
    id: number;
    status: PostStatus;
    ownerId: number;
    requesterId: number;
    ownerCompl: boolean;
    reqCompl: boolean;
  } | null;
  reports?: {
    id: number;
    reason: string;
    aiRationale: string | null;
    resolver: { id: number; name: string | null } | null;
    appeal: {
      id: number;
      status: 'PENDING' | 'GRANTED' | 'DENIED';
      message: string;
    } | null;
  }[];
};

export type PostUpdateData = {
  title: string;
  message: string;
  isLocal: boolean;
  zipCode: string | null;
  radiusMiles: number | null;
};

interface ManagePostsProps {
  open: boolean;
  onClose: () => void;
  posts: PostData[];
  title?: string;
  readOnly?: boolean;
  onUpdate?: (postId: number, postData: PostUpdateData) => Promise<void>;
  onDelete?: (postId: number) => Promise<void>;
  onComplete?: (tradeId: number) => Promise<void>;
}

export default function ManagePosts({
  open,
  onClose,
  posts,
  title = 'Manage Posts',
  readOnly = false,
  onUpdate,
  onDelete,
  onComplete,
}: ManagePostsProps) {
  const [editingPost, setEditingPost] = useState<PostData | null>(null);
  const [formData, setFormData] = useState<PostUpdateData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [completingTradeId, setCompletingTradeId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setEditingPost(null);
      setFormData(null);
      setSaving(false);
      setDeletingPostId(null);
      setCompletingTradeId(null);
    }
  }, [open]);

  const actionInProgress = (
    saving || deletingPostId !== null || completingTradeId !== null
  );

  const handleClose = () => {
    if (actionInProgress) return;

    setEditingPost(null);
    setFormData(null);
    onClose();
  };

  const startEditing = (post: PostData) => {
    setEditingPost(post);

    setFormData({
      title: post.title,
      message: post.message,
      isLocal: post.isLocal,
      zipCode: post.zipCode,
      radiusMiles: post.radiusMiles,
    });
  };

  const cancelEditing = () => {
    setEditingPost(null);
    setFormData(null);
  };

  const handleSave = async () => {
    if (!editingPost || !formData || !onUpdate) return;

    setSaving(true);

    try {
      await onUpdate(editingPost.id, {
        ...formData,
        title: formData.title.trim(),
        message: formData.message.trim(),
        zipCode: formData.isLocal ? formData.zipCode?.trim() || null : null,
        radiusMiles: formData.isLocal ? formData.radiusMiles : null,
      });

      cancelEditing();
    } catch (error) {
      console.error('Failed to update post:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (postId: number) => {
    if (!onDelete) return;

    setDeletingPostId(postId);

    try {
      await onDelete(postId);
    } catch (error) {
      console.error('Failed to delete post:', error);
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleComplete = async (tradeId: number) => {
    if (!onComplete) return;

    setCompletingTradeId(tradeId);

    try {
      await onComplete(tradeId);
    } catch (error) {
      console.error('Failed to complete trade:', error);
    } finally {
      setCompletingTradeId(null);
    }
  };

  const isInvalid = (!formData || !formData.title.trim() || !formData.message.trim() || (formData.isLocal && (!formData.zipCode?.trim() || !formData.radiusMiles || formData.radiusMiles <= 0)));

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>{title}</DialogTitle>

      <DialogContent dividers>
        {editingPost && formData ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title"
              required
              fullWidth
              value={formData.title}
              onChange={(event) => {
                setFormData({ ...formData, title: event.target.value });
              }}
            />

            <TextField
              label="Message"
              required
              fullWidth
              multiline
              rows={4}
              value={formData.message}
              onChange={(event) => {
                setFormData({ ...formData, message: event.target.value });
              }}
            />

            <FormControlLabel
              label="Local Trade Only"
              control={(
                <Switch
                  checked={formData.isLocal}
                  onChange={(event) => {
                    const isLocal = event.target.checked;

                    setFormData({
                      ...formData,
                      isLocal,
                      zipCode: isLocal ? formData.zipCode : null,
                      radiusMiles: isLocal ? formData.radiusMiles ?? 15 : null,
                    });
                  }}
                />
              )}
            />

            {formData.isLocal && (
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  label="Zip Code"
                  required
                  fullWidth
                  value={formData.zipCode ?? ''}
                  onChange={(event) => {
                    setFormData({ ...formData, zipCode: event.target.value });
                  }}
                />

                <TextField
                  label="Radius in Miles"
                  required
                  fullWidth
                  type="number"
                  value={formData.radiusMiles ?? ''}
                  slotProps={{ htmlInput: { min: 1 } }}
                  onChange={(event) => {
                    setFormData({ ...formData, radiusMiles: Number(event.target.value) });
                  }}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                disabled={saving || isInvalid}
                onClick={handleSave}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>

              <Button color="inherit" disabled={saving} onClick={cancelEditing}>
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {posts.length === 0 && (
              <Typography color="text.secondary">No posts found.</Typography>
            )}

            {posts.map((post) => (
              <Card key={post.id} variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {post.title}
                  </Typography>

                  <Typography sx={{ my: 1 }}>
                    {post.message}
                  </Typography>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {post.updatedAt && post.updatedAt !== post.createdAt
                      ? `Updated on ${formatPostDate(post.updatedAt)}`
                      : `Posted on ${formatPostDate(post.createdAt)}`}
                  </Typography>

                  {!readOnly && !post.isRemoved && (
                    <Box sx={{
                      display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2,
                    }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={actionInProgress}
                        onClick={() => startEditing(post)}
                      >
                        Update
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={actionInProgress}
                        onClick={() => handleDelete(post.id)}
                      >
                        {deletingPostId === post.id ? 'Deleting...' : 'Delete'}
                      </Button>

                      {post.trade && (post.trade.status === 'IN_PROGRESS' || post.trade.status === 'WAITING_FOR_OTHER_USER') && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disabled={actionInProgress}
                          onClick={() => handleComplete(post.trade!.id)}
                        >
                          {completingTradeId === post.trade!.id ? 'Completing...' : 'Trade Complete'}
                        </Button>
                      )}
                    </Box>
                  )}

                  {post.isRemoved && post.reports && post.reports.length > 0 && (
                    <WhyRemovedMenu report={post.reports[0]} />
                  )}

                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={actionInProgress}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
