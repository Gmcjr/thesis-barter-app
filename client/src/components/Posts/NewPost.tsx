/* eslint-disable max-len */
import React, { useState } from 'react';
import axios from 'axios';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import type { CatType, Cond } from '../../../../server/db/generated/browser';

// type definitions
export interface PostFormData {
  title: string;
  name: string;
  offerType: CatType;
  category: string;
  description: string;
  condition?: Cond;
  isLocal: boolean;
  zipCode?: string;
  radiusMiles?: number;
  previewMediaId?: number;
  fullMediaId?: number;
}

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: PostFormData) => Promise<void>;
}

type FormState = {
  title: string;
  name: string;
  offerType: CatType;
  category: string;
  description: string;
  condition: Cond;
  isLocal: boolean;
  zipCode: string;
  radiusMiles: number;
};

const initialForm: FormState = {
  title: '',
  name: '',
  offerType: 'PRODUCT',
  category: '',
  description: '',
  condition: 'GOOD',
  isLocal: false,
  zipCode: '',
  radiusMiles: 15,
};

// creates a watermark for the image preview
const createWatermark = (file: File): Promise<Blob> => new Promise((resolve, reject) => {
  const sourceImage = new Image();

  sourceImage.onload = () => {
    const outputCanvas = document.createElement('canvas');
    const outputContext = outputCanvas.getContext('2d');
    if (!outputContext) {
      reject(new Error('Canvas context error'));
      return;
    }

    const scaleFactor = Math.min(1000 / sourceImage.width, 1000 / sourceImage.height, 1);
    const scaledWidth = sourceImage.width * scaleFactor;
    const scaledHeight = sourceImage.height * scaleFactor;

    outputCanvas.width = scaledWidth;
    outputCanvas.height = scaledHeight;
    outputContext.drawImage(sourceImage, 0, 0, scaledWidth, scaledHeight);

    const watermarkTile = document.createElement('canvas');
    watermarkTile.width = 180;
    watermarkTile.height = 70;
    const watermarkTileContext = watermarkTile.getContext('2d');

    if (watermarkTileContext) {
      watermarkTileContext.font = 'bold 14px sans-serif';
      watermarkTileContext.fillStyle = 'rgba(255, 255, 255, 0.4)';
      watermarkTileContext.textAlign = 'center';
      watermarkTileContext.textBaseline = 'middle';

      watermarkTileContext.fillText('TRADE PREVIEW ONLY', 90, 18);
      watermarkTileContext.fillText('TRADE PREVIEW ONLY', 0, 52);
      watermarkTileContext.fillText('TRADE PREVIEW ONLY', 180, 52);
    }

    outputContext.translate(scaledWidth / 2, scaledHeight / 2);
    outputContext.rotate((-30 * Math.PI) / 180);

    const watermarkPattern = outputContext.createPattern(watermarkTile, 'repeat');
    if (watermarkPattern) {
      outputContext.fillStyle = watermarkPattern;
      const overfillSize = Math.max(scaledWidth, scaledHeight) * 2;
      outputContext.fillRect(-overfillSize, -overfillSize, overfillSize * 2, overfillSize * 2);
    }

    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Blob failed'));
        }
      },
      'image/jpeg',
      0.85,
    );
  };

  sourceImage.onerror = () => {
    reject(new Error('Failed to load image'));
  };
  sourceImage.src = URL.createObjectURL(file);
});

export default function CreatePostModal({
  open,
  onClose,
  onSubmit,
}: CreatePostModalProps) {
  const [formData, setFormData] = useState<FormState>(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // change handler
  const handleChange = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setFormData((prev) => {
      const updates: Partial<FormState> = { [field]: value };
      if (field === 'offerType') {
        updates.category = '';
        if (value === 'DIGITAL') {
          updates.isLocal = false;
        }
      }
      return { ...prev, ...updates };
    });
  };

  // close and reset the form
  const handleClose = () => {
    setFormData(initialForm);
    setFile(null);
    onClose();
  };

  const uploadFileToS3 = async (
    fileOrBlob: File | Blob,
    filename: string,
    contentType: string,
    variant: 'PREVIEW' | 'FULL',
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
      variant,
    });

    return mediaRes.data.id;
  };

  // check for valid data
  const isInvalid = (!formData.title.trim() || !formData.name.trim() || !formData.category.trim() || !formData.description.trim() || (formData.isLocal && !formData.zipCode.trim()) || (formData.offerType === 'DIGITAL' && !file));

  // submit handler for the form
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isInvalid) return;

    setIsSubmitting(true);
    try {
      let previewMediaId: number | undefined;
      let fullMediaId: number | undefined;

      if (formData.offerType === 'DIGITAL' && file) {
        const previewBlob = await createWatermark(file);
        previewMediaId = await uploadFileToS3(previewBlob, `preview_${file.name}`, 'image/jpeg', 'PREVIEW');
        fullMediaId = await uploadFileToS3(file, file.name, file.type, 'FULL');
      }

      await onSubmit({
        title: formData.title.trim(),
        name: formData.name.trim(),
        offerType: formData.offerType,
        category: formData.category.trim(),
        description: formData.description.trim(),
        condition: formData.offerType === 'PRODUCT' ? formData.condition : undefined,
        isLocal: formData.isLocal,
        zipCode: formData.isLocal ? formData.zipCode.trim() : undefined,
        radiusMiles: formData.isLocal ? formData.radiusMiles : undefined,
        previewMediaId,
        fullMediaId,
      });

      setFormData(initialForm);
      setFile(null);
      onClose();
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Create New Trade Post</DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            {/* Title */}
            <TextField
              label="Post Title"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              disabled={isSubmitting}
            />

            {/* Item / Service Name */}
            <TextField
              label="Item or Service Name"
              placeholder="e.g., Acoustic guitar or Guitar Lessons"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isSubmitting}
            />

            {/* Type of Offer */}
            <RadioGroup
              row
              value={formData.offerType}
              onChange={(e) => handleChange('offerType', e.target.value as CatType)}
            >
              <FormControlLabel value="PRODUCT" control={<Radio disabled={isSubmitting} />} label="Item" />
              <FormControlLabel value="SERVICE" control={<Radio disabled={isSubmitting} />} label="Service" />
              <FormControlLabel value="DIGITAL" control={<Radio disabled={isSubmitting} />} label="Digital Trade" />
            </RadioGroup>

            {/* Category */}
            <TextField
              label="Category"
              fullWidth
              required
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              disabled={isSubmitting}
            />

            {/* Digital Trade File Upload */}
            <Collapse in={formData.offerType === 'DIGITAL'} unmountOnExit>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} disabled={isSubmitting}>
                  Attach Artwork
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </Button>
                {file && (
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                    {file.name}
                  </Typography>
                )}
              </Box>
            </Collapse>

            {/* Description */}
            <TextField
              label="Description"
              multiline
              rows={3}
              fullWidth
              required
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={isSubmitting}
            />

            {/* Condition (Product Only) */}
            <Collapse in={formData.offerType === 'PRODUCT'} unmountOnExit>
              <FormControl fullWidth disabled={isSubmitting}>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={formData.condition}
                  label="Condition"
                  onChange={(e) => handleChange('condition', e.target.value)}
                >
                  <MenuItem value="POOR">Poor</MenuItem>
                  <MenuItem value="AVERAGE">Average</MenuItem>
                  <MenuItem value="GOOD">Good</MenuItem>
                  <MenuItem value="EXCELLENT">Excellent</MenuItem>
                  <MenuItem value="MINT">Mint</MenuItem>
                </Select>
              </FormControl>
            </Collapse>

            {/* Local Trade Toggle */}
            <Collapse in={formData.offerType !== 'DIGITAL'} unmountOnExit>
              <FormControlLabel
                control={(
                  <Switch
                    checked={formData.isLocal}
                    disabled={isSubmitting}
                    onChange={(e) => handleChange('isLocal', e.target.checked)}
                  />
                )}
                label="Local Trade Only"
              />
            </Collapse>

            {/* Zip Code & Radius */}
            <Collapse in={formData.isLocal && formData.offerType !== 'DIGITAL'} unmountOnExit>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField
                    label="Zip Code"
                    fullWidth
                    required
                    value={formData.zipCode}
                    onChange={(e) => handleChange('zipCode', e.target.value)}
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid size={6}>
                  <FormControl fullWidth disabled={isSubmitting}>
                    <InputLabel>Max Distance</InputLabel>
                    <Select
                      value={formData.radiusMiles}
                      label="Max Distance"
                      onChange={(e) => handleChange('radiusMiles', Number(e.target.value))}
                    >
                      <MenuItem value={5}>Within 5 miles</MenuItem>
                      <MenuItem value={15}>Within 15 miles</MenuItem>
                      <MenuItem value={30}>Within 30 miles</MenuItem>
                      <MenuItem value={50}>Within 50 miles</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Collapse>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} color="inherit" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isInvalid || isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Create Post'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
