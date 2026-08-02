/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
import Divider from '@mui/material/Divider';
import DownloadIcon from '@mui/icons-material/Download';
import CircularProgress from '@mui/material/CircularProgress';

import WhyRemovedMenu from './WhyRemovedMenu';
import { formatPostDate } from '../../utils/utils';

export type PostData = {
  id: number;
  userId: number;
  title: string;
  message: string;
  isLocal: boolean;
  zipCode: string | null;
  radiusMiles: number | null;
  isComplete: boolean;
  isRemoved: boolean;
  createdAt: string;
  updatedAt?: string;
  previewUrl?: string | null;
  fullUrl?: string | null;
  tradeOffers?: {
    id: number;
    offererId: number;
    status: string;
    previewUrl?: string | null;
    fullUrl?: string | null;
  }[];
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
  currentUserId?: number;
  onUpdate?: (postId: number, postData: PostUpdateData) => Promise<void>;
  onDelete?: (postId: number) => Promise<void>;
  onComplete?: (postId: number) => Promise<void>;
}

export default function ManagePosts({
  open,
  onClose,
  posts,
  title = 'Manage Posts',
  readOnly = false,
  currentUserId,
  onUpdate,
  onDelete,
  onComplete,
}: ManagePostsProps) {
  const [editingPost, setEditingPost] = useState<PostData | null>(null);
  const [formData, setFormData] = useState<PostUpdateData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [completingPostId, setCompletingPostId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setEditingPost(null);
      setFormData(null);
      setSaving(false);
      setDeletingPostId(null);
      setCompletingPostId(null);
      setDownloadingId(null);
    }
  }, [open]);

  const actionInProgress = (
    saving || deletingPostId !== null || completingPostId !== null || downloadingId !== null
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

  const handleComplete = async (postId: number) => {
    if (!onComplete) return;

    setCompletingPostId(postId);

    try {
      await onComplete(postId);
    } catch (error) {
      console.error('Failed to complete trade:', error);
    } finally {
      setCompletingPostId(null);
    }
  };

  // file download handler
  const handleDownloadToPC = async (imageUrl: string, postId: number, postTitle: string) => {
    try {
      setDownloadingId(postId);
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;

      const safeTitle = postTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `Art_Received_${safeTitle}.jpg`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Failed to save file:', error);
      window.open(imageUrl, '_blank');
    } finally {
      setDownloadingId(null);
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

            {posts.map((post) => {
              const completedOffer = post.tradeOffers?.find((o) => o.status === 'COMPLETED');
              const sentUrl = post.userId === currentUserId
                ? (post.previewUrl || undefined)
                : (completedOffer?.previewUrl || undefined);

              const receivedUrl = post.userId === currentUserId
                ? (completedOffer?.fullUrl || undefined)
                : (post.fullUrl || undefined);

              if (post.isRemoved) {
                const report = post.reports?.[0];

                return (
                  <Accordion
                    key={post.id}
                    disableGutters
                    elevation={0}
                    sx={{
                      border: '1px solid',
                      borderColor: 'error.main',
                      borderRadius: 2,
                      // kills MUI's default top divider line
                      '&:before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ minHeight: 0, '& .MuiAccordionSummary-content': { my: 1 } }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} noWrap>
                          {post.title}
                        </Typography>
                        <Typography variant="caption" color="error">
                          Removed
                          {report ? ` - ${report.reason.replace(/_/g, ' ')}` : ''}
                        </Typography>
                      </Box>
                    </AccordionSummary>

                    <AccordionDetails sx={{ pt: 0 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {post.message}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {post.updatedAt && post.updatedAt !== post.createdAt
                          ? `Updated on ${formatPostDate(post.updatedAt)}`
                          : `Posted on ${formatPostDate(post.createdAt)}`}
                      </Typography>

                      {report && <WhyRemovedMenu report={report} />}
                    </AccordionDetails>
                  </Accordion>
                );
              }

              return (
                <Card key={post.id} variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {post.title}
                    </Typography>

                    <Typography sx={{ my: 1 }}>
                      {post.message}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      {post.updatedAt && post.updatedAt !== post.createdAt
                        ? `Updated on ${formatPostDate(post.updatedAt)}`
                        : `Posted on ${formatPostDate(post.createdAt)}`}
                    </Typography>

                    {/* Digital Art Layout for Completed Trades */}
                    {readOnly && post.tradeOffers && completedOffer && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                          {/* Art Sent */}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                              Art Sent:
                            </Typography>
                            <Box sx={{
                              bgcolor: '#121212', borderRadius: 2, p: 1, textAlign: 'center', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                              bgcolor: '#121212', borderRadius: 2, p: 1, textAlign: 'center', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
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

                            {receivedUrl && (
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={downloadingId === post.id ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                                disabled={actionInProgress}
                                onClick={() => handleDownloadToPC(receivedUrl, post.id, post.title)}
                                sx={{ mt: 1.5, alignSelf: 'flex-start' }}
                              >
                                {downloadingId === post.id ? 'Saving File...' : 'Download Art Received'}
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </>
                    )}

                    {!readOnly && (
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

                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disabled={actionInProgress}
                          onClick={() => handleComplete(post.id)}
                        >
                          {completingPostId === post.id ? 'Completing...' : 'Trade Complete'}
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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
