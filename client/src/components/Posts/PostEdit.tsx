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
import { useTheme } from '@mui/material/styles';

import type { PostData, PostUpdateData } from './ManagePosts';
import { formatPostDate } from '../../utils/utils';
import { useToast } from '../../context/ToastContext';
import { useRouter } from '../../context/RouterContext';

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
  const theme = useTheme();
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 'clamp(5px, 1cqw, 10px)',
          gap: 'clamp(6px, 1.5cqw, 14px)',
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <TextField
            label="Title"
            required
            fullWidth
            size="small"
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            sx={{
              '& .MuiInputBase-root': {
                fontSize: 'clamp(0.65rem, 1.7cqw, 1rem)',
                height: 'clamp(32px, 5cqw, 40px)',
              },
              '& .MuiInputLabel-root': {
                fontSize: 'clamp(0.6rem, 1.55cqw, 0.9rem)',
              },
            }}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontSize: 'clamp(0.5rem, 1.35cqw, 0.75rem)',
            }}
          >
            {((post.updatedAt && post.updatedAt !== post.createdAt) && `Updated on ${formatPostDate(post.updatedAt)}`) || `Posted on ${formatPostDate(post.createdAt)}`}
          </Typography>
        </Box>

        <Box
          onClick={() => navigate(`/profile/${post.user.id}`)}
          role="button"
          tabIndex={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(4px, 1cqw, 8px)',
            cursor: 'pointer',
            flexShrink: 0,
            '&:hover .post-username': { textDecoration: 'underline' },
          }}
        >
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 'clamp(20px, 4cqw, 32px)',
              height: 'clamp(20px, 4cqw, 32px)',
              fontSize: 'clamp(0.55rem, 1.5cqw, 0.9rem)',
            }}
          >
            {postUser.charAt(0).toUpperCase()}
          </Avatar>

          <Typography
            variant="subtitle2"
            className="post-username"
            sx={{
              whiteSpace: 'nowrap',
              fontSize: 'clamp(0.55rem, 1.55cqw, 0.875rem)',
            }}
          >
            {postUser}
          </Typography>
        </Box>
      </Box>

      {isArtTrade && (
        <Box sx={{ mb: 'clamp(6px, 1.5cqw, 12px)' }}>
          <Box
            sx={{
              position: 'relative',
              width: '88%',
              mx: 'auto',
              aspectRatio: '2.8 / 1',
              bgcolor: 'surface.sunken',
              borderRadius: theme.radius.md,
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

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(5px, 1.2cqw, 10px)',
              mt: 'clamp(5px, 1.2cqw, 10px)',
            }}
          >
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              disabled={saving}
              sx={{
                minWidth: 0,
                px: 'clamp(6px, 1.3cqw, 12px)',
                py: 'clamp(2px, 0.5cqw, 4px)',
                fontSize: 'clamp(0.5rem, 1.35cqw, 0.8125rem)',
                '& .MuiSvgIcon-root': {
                  fontSize: 'clamp(14px, 2cqw, 20px)',
                },
              }}
            >
              Replace Artwork
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => handleDigitalFileChange(event.target.files?.[0] || null)}
              />
            </Button>

            {editDigitalFile && (
              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
                sx={{
                  maxWidth: '28%',
                  fontSize: 'clamp(0.5rem, 1.35cqw, 0.8125rem)',
                }}
              >
                {editDigitalFile.name}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {!isArtTrade && (
        <Box sx={{ mb: 'clamp(6px, 1.5cqw, 12px)' }}>
          {editImages[0] && (
            <Box
              sx={{
                position: 'relative',
                width: '88%',
                mx: 'auto',
                aspectRatio: '2.8 / 1',
                bgcolor: 'surface.sunken',
                borderRadius: theme.radius.md,
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
              gap: 'clamp(4px, 1cqw, 8px)',
              mt: 'clamp(5px, 1.2cqw, 10px)',
              overflowX: 'auto',
              pb: 'clamp(2px, 0.5cqw, 4px)',
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
                  width: 'clamp(38px, 8cqw, 72px)',
                  aspectRatio: '1 / 1',
                  flexShrink: 0,
                  borderRadius: theme.radius.sm,
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
                    top: '2%',
                    right: '2%',
                    width: 'clamp(18px, 3.2cqw, 30px)',
                    height: 'clamp(18px, 3.2cqw, 30px)',
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'background.paper',
                    },
                  }}
                >
                  <DeleteIcon
                    sx={{
                      fontSize: 'clamp(12px, 2cqw, 20px)',
                    }}
                  />
                </IconButton>
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(5px, 1.2cqw, 10px)',
              mt: 'clamp(5px, 1.2cqw, 10px)',
            }}
          >
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              disabled={saving || editImages.length >= 5}
              sx={{
                minWidth: 0,
                px: 'clamp(6px, 1.3cqw, 12px)',
                py: 'clamp(2px, 0.5cqw, 4px)',
                fontSize: 'clamp(0.5rem, 1.35cqw, 0.8125rem)',
              }}
            >
              Add Images
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(event) => handleAddImages(event.target.files)}
              />
            </Button>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: 'clamp(0.5rem, 1.35cqw, 0.8125rem)',
              }}
            >
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
        rows={2}
        value={editMessage}
        onChange={(event) => setEditMessage(event.target.value)}
        sx={{
          mb: 'clamp(6px, 1.5cqw, 12px)',
          '& .MuiInputBase-root': {
            fontSize: 'clamp(0.65rem, 1.7cqw, 1rem)',
            p: 'clamp(6px, 1.2cqw, 10px)',
          },
          '& .MuiInputBase-inputMultiline': {
            p: 0,
            lineHeight: 1.35,
          },
          '& .MuiInputLabel-root': {
            fontSize: 'clamp(0.6rem, 1.55cqw, 0.9rem)',
          },
        }}
      />

      <Box
        sx={{
          display: 'flex',
          gap: 'clamp(4px, 1cqw, 8px)',
          mb: 'clamp(6px, 1.5cqw, 12px)',
        }}
      >
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          disabled={saving || !editTitle.trim() || !editMessage.trim()}
          onClick={handleSaveEdit}
          sx={{
            minWidth: 0,
            px: 'clamp(6px, 1.5cqw, 12px)',
            py: 'clamp(3px, 0.7cqw, 6px)',
            fontSize: 'clamp(0.55rem, 1.45cqw, 0.875rem)',
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>

        <Button
          color="inherit"
          disabled={saving}
          onClick={handleCancel}
          sx={{
            minWidth: 0,
            px: 'clamp(6px, 1.5cqw, 12px)',
            py: 'clamp(3px, 0.7cqw, 6px)',
            fontSize: 'clamp(0.55rem, 1.45cqw, 0.875rem)',
          }}
        >
          Cancel
        </Button>
      </Box>
    </>
  );
}
