import React, { useState } from 'react';
import axios from 'axios';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

import type { PostData, PostUpdateData } from './ManagePosts';
import { formatPostDate } from '../../utils/utils';
import { useToast } from '../../context/ToastContext';
import { useRouter } from '../../context/RouterContext';
import { radius } from '../../theme';

type EditableImage = {
  id: string;
  url: string;
  mediaId?: number;
  file?: File;
};

interface PostEditProps {
  post: PostData;
  postUser: string;
  onUpdate?: (postId: number, postData: PostUpdateData) => Promise<void>;
  onCancel: () => void;
}

export default function PostEdit({
  post,
  postUser,
  onUpdate,
  onCancel,
}: PostEditProps) {
  const { showToast } = useToast();
  const { navigate } = useRouter();

  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editMessage, setEditMessage] = useState(post.message);
  const [editImages, setEditImages] = useState<EditableImage[]>(() => {
    const imageItems = post.imageItems ?? [];

    if (imageItems.length > 0) {
      return imageItems.map((imageItem) => ({
        id: `media-${imageItem.mediaId}`,
        url: imageItem.url,
        mediaId: imageItem.mediaId,
      }));
    }

    return (post.imageUrls ?? []).map((imageUrl, index) => ({
      id: `url-${index}`,
      url: imageUrl,
    }));
  });
  const [editCurrentImageIndex, setEditCurrentImageIndex] = useState(0);
  const [editDigitalFile, setEditDigitalFile] = useState<File | null>(null);
  const [editDigitalFileUrl, setEditDigitalFileUrl] = useState<string | null>(null);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);

  const isArtTrade = Boolean(post.previewUrl || post.fullUrl);

  const uploadFileToS3 = async (
    fileOrBlob: File | Blob,
    filename: string,
    contentType: string,
    variant?: 'PREVIEW' | 'FULL',
  ) => {
    const presignRes = await axios.post<{ uploadUrl: string; key: string }>('/media/presign', {
      filename,
      contentType,
    });
    const { uploadUrl, key } = presignRes.data;

    await axios.put(uploadUrl, fileOrBlob, {
      headers: { 'Content-Type': contentType },
    });

    const mediaRes = await axios.post<{ id: number }>('/media', {
      key,
      ...(variant && { variant }),
    });

    return mediaRes.data.id;
  };

  const revokeEditUrls = () => {
    editImages.forEach((image) => {
      if (image.file) URL.revokeObjectURL(image.url);
    });

    if (editDigitalFileUrl) URL.revokeObjectURL(editDigitalFileUrl);
  };

  const handleCancel = () => {
    revokeEditUrls();
    onCancel();
  };

  const handleAddImages = (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    const spotsLeft = 5 - editImages.length;
    const nextImages = selectedFiles.slice(0, spotsLeft).map((file) => ({
      id: `file-${file.name}-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file,
    }));

    setEditImages([...editImages, ...nextImages]);
  };

  const handleDigitalFileChange = (file: File | null) => {
    if (editDigitalFileUrl) URL.revokeObjectURL(editDigitalFileUrl);

    setEditDigitalFile(file);
    setEditDigitalFileUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleRemoveImage = (imageId: string) => {
    const imageToRemove = editImages.find((image) => image.id === imageId);

    if (imageToRemove?.file) URL.revokeObjectURL(imageToRemove.url);

    const nextImages = editImages.filter((image) => image.id !== imageId);
    setEditImages(nextImages);

    if (editCurrentImageIndex >= nextImages.length) {
      setEditCurrentImageIndex(Math.max(nextImages.length - 1, 0));
    }
  };

  const handleDropImage = (targetImageId: string) => {
    if (!draggedImageId || draggedImageId === targetImageId) return;

    const draggedImage = editImages.find((image) => image.id === draggedImageId);

    if (!draggedImage) return;

    const remainingImages = editImages.filter((image) => image.id !== draggedImageId);
    const targetIndex = remainingImages.findIndex((image) => image.id === targetImageId);

    setEditImages([
      ...remainingImages.slice(0, targetIndex),
      draggedImage,
      ...remainingImages.slice(targetIndex),
    ]);
    setDraggedImageId(null);
  };

  const handleSaveEdit = async () => {
    if (!onUpdate || !editTitle.trim() || !editMessage.trim()) return;

    setSaving(true);

    try {
      if (isArtTrade) {
        let previewMediaId = post.previewMediaId ?? null;
        let fullMediaId = post.fullMediaId ?? null;

        if (editDigitalFile) {
          previewMediaId = await uploadFileToS3(editDigitalFile, `preview_${editDigitalFile.name}`, editDigitalFile.type, 'PREVIEW');
          fullMediaId = await uploadFileToS3(editDigitalFile, editDigitalFile.name, editDigitalFile.type, 'FULL');
        }

        await onUpdate(post.id, {
          title: editTitle.trim(),
          message: editMessage.trim(),
          isLocal: post.isLocal,
          zipCode: post.zipCode,
          radiusMiles: post.radiusMiles,
          previewMediaId,
          fullMediaId,
        });
      } else {
        const mediaIds = await Promise.all(
          editImages.map(async (image) => {
            if (image.mediaId) return image.mediaId;
            if (!image.file) return null;
            return uploadFileToS3(image.file, image.file.name, image.file.type);
          }),
        );

        await onUpdate(post.id, {
          title: editTitle.trim(),
          message: editMessage.trim(),
          isLocal: post.isLocal,
          zipCode: post.zipCode,
          radiusMiles: post.radiusMiles,
          mediaIds: mediaIds.filter((mediaId): mediaId is number => mediaId !== null),
        });
      }

      revokeEditUrls();
      onCancel();
    } catch (error) {
      console.error('Failed to update post:', error);
      showToast('Failed to update post', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Box sx={{
        display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: { xs: 'flex-start', sm: 'space-between' }, alignItems: { xs: 'stretch', sm: 'flex-start' }, mb: 2, gap: { xs: 1, sm: 2 },
      }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{
            display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 1.5,
          }}
          >
            <TextField
              label="Title"
              required
              fullWidth
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
            />
          </Box>

          <Typography variant="caption" color="text.secondary">
            {((post.updatedAt && post.updatedAt !== post.createdAt) && `Updated on ${formatPostDate(post.updatedAt)}`) || `Posted on ${formatPostDate(post.createdAt)}`}
          </Typography>
        </Box>

        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, flexWrap: 'wrap',
        }}
        >
          <Box
            onClick={() => navigate(`/profile/${post.user.id}`)}
            role="button"
            tabIndex={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              '&:hover .post-username': { textDecoration: 'underline' },
            }}
          >
            <Avatar sx={{
              bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.9rem',
            }}
            >
              {postUser.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="subtitle2" className="post-username">
              {postUser}
            </Typography>
          </Box>
        </Box>
      </Box>

      {isArtTrade && (
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
            {(editDigitalFileUrl || post.previewUrl) && (
              <img
                src={editDigitalFileUrl ?? post.previewUrl ?? undefined}
                alt="Post Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            )}
          </Box>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 2, mt: 1.5,
          }}
          >
            <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} disabled={saving}>
              Replace Artwork
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => handleDigitalFileChange(event.target.files?.[0] || null)}
              />
            </Button>
            {editDigitalFile && (
              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                {editDigitalFile.name}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {!isArtTrade && (
        <Box sx={{ mb: 2 }}>
          {editImages[0] && (
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
                src={editImages[editCurrentImageIndex]?.url ?? editImages[0].url}
                alt={`Post ${editCurrentImageIndex + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
          )}

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
            {editImages.map((image, index) => (
              <Box
                key={image.id}
                draggable
                onDragStart={() => setDraggedImageId(image.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDropImage(image.id)}
                onClick={() => setEditCurrentImageIndex(index)}
                role="button"
                tabIndex={0}
                sx={{
                  width: 72,
                  height: 72,
                  flexShrink: 0,
                  borderRadius: radius.sm,
                  overflow: 'hidden',
                  cursor: 'grab',
                  border: '2px solid',
                  borderColor: index === editCurrentImageIndex ? 'primary.main' : 'border.default',
                  opacity: index === editCurrentImageIndex ? 1 : 0.7,
                  position: 'relative',
                  transition: 'opacity 0.15s ease, border-color 0.15s ease',
                  '&:hover': {
                    opacity: 1,
                  },
                }}
              >
                <img
                  src={image.url}
                  alt={`Post Thumbnail ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <IconButton
                  size="small"
                  aria-label="Remove image"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemoveImage(image.id);
                  }}
                  sx={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'background.paper',
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>

          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 2, mt: 1.5,
          }}
          >
            <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} disabled={saving || editImages.length >= 5}>
              Add Images
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(event) => handleAddImages(event.target.files)}
              />
            </Button>
            <Typography variant="body2" color="text.secondary">
              {editImages.length}
              {' '}
              of 5 images selected
            </Typography>
          </Box>
        </Box>
      )}

      <TextField
        label="Description"
        required
        fullWidth
        multiline
        rows={3}
        value={editMessage}
        onChange={(event) => setEditMessage(event.target.value)}
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          disabled={saving || !editTitle.trim() || !editMessage.trim()}
          onClick={handleSaveEdit}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>

        <Button color="inherit" disabled={saving} onClick={handleCancel}>
          Cancel
        </Button>
      </Box>
    </>
  );
}
