import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ImageCropDialog from './ImageCropDialog';
import type { EditProfileModalProps, ProfileUpdateData } from './types';
import { isValidPhone, isValidZipCode } from '../../utils/validation';

export const BIO_MAX_LENGTH = 250;
const AVATAR_ASPECT = 1;
const BANNER_ASPECT = 3;

interface PendingCrop {
  slot: 'avatar' | 'banner';
  objectUrl: string;
  mimeType: string;
}

export default function EditProfileModal({
  open, onClose, initialData, onSave,
  avatarUrl, bannerUrl, avatarUploading, bannerUploading,
  onAvatarChange, onAvatarRemove, onBannerChange, onBannerRemove,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState<ProfileUpdateData>(initialData);
  const [saving, setSaving] = useState(false);
  const [pendingCrop, setPendingCrop] = useState<PendingCrop | null>(null);

  useEffect(() => {
    if (open) setFormData(initialData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Revoke the object URL we created for the crop dialog once it's no
  // longer needed, so we don't leak memory across repeated edits.
  useEffect(() => () => {
    if (pendingCrop) URL.revokeObjectURL(pendingCrop.objectUrl);
  }, [pendingCrop]);

  const phoneError = Boolean(formData.phone.trim()) && !isValidPhone(formData.phone);
  const zipError = Boolean(formData.zipCode.trim()) && !isValidZipCode(formData.zipCode);

  const isInvalid = !formData.name.trim() || phoneError || zipError;

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const openCropDialog = (slot: 'avatar' | 'banner') => (
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      setPendingCrop({ slot, objectUrl: URL.createObjectURL(file), mimeType: file.type });
    }
  );

  const closeCropDialog = () => {
    if (pendingCrop) URL.revokeObjectURL(pendingCrop.objectUrl);
    setPendingCrop(null);
  };

  const handleCropped = async (blob: Blob) => {
    if (!pendingCrop) return;
    const { slot, mimeType } = pendingCrop;
    const extension = mimeType.split('/')[1] ?? 'jpg';
    const file = new File([blob], `${slot}.${extension}`, { type: mimeType });
    closeCropDialog();
    if (slot === 'avatar') await onAvatarChange(file);
    else await onBannerChange(file);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ position: 'relative', mb: 6 }}>
          <Box sx={{
            position: 'relative',
            height: 120,
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: bannerUrl ? undefined : 'surface.sunken',
            backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          >
            <IconButton
              size="small"
              component="label"
              disabled={bannerUploading}
              aria-label="Change banner"
              sx={{
                position: 'absolute', bottom: 8, right: 8, bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' },
              }}
            >
              {bannerUploading ? <CircularProgress size={16} /> : <PhotoCameraIcon fontSize="small" />}
              <input type="file" accept="image/*" hidden onChange={openCropDialog('banner')} />
            </IconButton>
            {bannerUrl && (
              <IconButton
                size="small"
                onClick={onBannerRemove}
                disabled={bannerUploading}
                aria-label="Remove banner"
                sx={{
                  position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          <Box sx={{ position: 'absolute', left: 16, bottom: -32 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={avatarUrl ?? undefined}
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: 'primary.main',
                  fontSize: '1.75rem',
                  border: '3px solid',
                  borderColor: 'background.paper',
                }}
              >
                {formData.name.charAt(0).toUpperCase()}
              </Avatar>
              <IconButton
                size="small"
                component="label"
                disabled={avatarUploading}
                aria-label="Change profile photo"
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  width: 26,
                  height: 26,
                  bgcolor: 'background.paper',
                  border: (theme) => `1px solid ${theme.palette.border.default}`,
                  '&:hover': { bgcolor: 'background.paper' },
                }}
              >
                {avatarUploading
                  ? <CircularProgress size={14} />
                  : <PhotoCameraIcon sx={{ fontSize: 14 }} />}
                <input type="file" accept="image/*" hidden onChange={openCropDialog('avatar')} />
              </IconButton>
              {avatarUrl && (
                <IconButton
                  size="small"
                  onClick={onAvatarRemove}
                  disabled={avatarUploading}
                  aria-label="Remove profile photo"
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 22,
                    height: 22,
                    bgcolor: 'background.paper',
                    border: (theme) => `1px solid ${theme.palette.border.default}`,
                    '&:hover': { bgcolor: 'background.paper' },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 12 }} />
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            label="Bio"
            fullWidth
            multiline
            rows={3}
            value={formData.bio}
            onChange={(e) => setFormData({
              ...formData, bio: e.target.value.slice(0, BIO_MAX_LENGTH),
            })}
            slotProps={{ htmlInput: { maxLength: BIO_MAX_LENGTH } }}
            helperText={`${formData.bio.length}/${BIO_MAX_LENGTH}`}
          />
          <TextField
            label="Phone"
            fullWidth
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={phoneError}
            helperText={phoneError ? 'Enter a valid phone number.' : ' '}
          />
          <TextField
            label="Zip Code"
            fullWidth
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
            error={zipError}
            helperText={zipError ? 'Enter a valid zip code (e.g. 94103).' : ' '}
          />

          <Divider sx={{ my: 0.5 }} />

          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Privacy
          </Typography>

          <FormControlLabel
            label="Show my email on my profile"
            control={(
              <Switch
                checked={formData.emailVisible}
                onChange={(e) => setFormData({ ...formData, emailVisible: e.target.checked })}
              />
            )}
          />
          <FormControlLabel
            label="Show my trade history to other users"
            control={(
              <Switch
                checked={formData.tradeHistoryVisible}
                onChange={(e) => setFormData({
                  ...formData, tradeHistoryVisible: e.target.checked,
                })}
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" disabled={saving || isInvalid} onClick={handleSave}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>

      <ImageCropDialog
        open={Boolean(pendingCrop)}
        imageSrc={pendingCrop?.objectUrl ?? null}
        aspect={pendingCrop?.slot === 'avatar' ? AVATAR_ASPECT : BANNER_ASPECT}
        cropShape={pendingCrop?.slot === 'avatar' ? 'round' : 'rect'}
        mimeType={pendingCrop?.mimeType ?? 'image/jpeg'}
        title={pendingCrop?.slot === 'avatar' ? 'Adjust Profile Photo' : 'Adjust Banner'}
        onCancel={closeCropDialog}
        onCropped={handleCropped}
      />
    </Dialog>
  );
}
