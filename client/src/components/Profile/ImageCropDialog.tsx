import React, { useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { getCroppedImageBlob, type PixelCrop } from '../../utils/cropImage';

export interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  aspect: number;
  cropShape?: 'rect' | 'round';
  mimeType: string;
  title: string;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}

export default function ImageCropDialog({
  open, imageSrc, aspect, cropShape = 'rect', mimeType, title, onCancel, onCropped,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const handleCropComplete = (_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, mimeType);
      reset();
      onCropped(blob);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{
          position: 'relative', width: '100%', height: 320, bgcolor: 'common.black',
        }}
        >
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          )}
        </Box>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 2, mt: 2, px: 1,
        }}
        >
          <ZoomInIcon fontSize="small" color="action" />
          <Slider
            size="small"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(_e, value) => setZoom(value as number)}
            aria-label="Zoom"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !croppedAreaPixels}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
