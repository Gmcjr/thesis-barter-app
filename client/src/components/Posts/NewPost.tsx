import React, { useState } from 'react';
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

import type { Cat, CatType, Cond } from '../../../../server/db/generated/browser';

type Category = Pick<Cat, 'id' | 'name' | 'type'>;

// type definitions
export interface PostFormData {
  title: string;
  name: string;
  offerType: CatType;
  catId: number;
  description: string;
  condition?: Cond;
  isLocal: boolean;
  zipCode?: string;
  radiusMiles?: number;
  images?: string[];
}

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: PostFormData) => Promise<void>;
  categories: Category[];
}

const initialForm = {
  title: '',
  name: '',
  offerType: 'PRODUCT' as CatType,
  catId: '' as number | '',
  description: '',
  condition: 'GOOD' as Cond,
  isLocal: false,
  zipCode: '',
  radiusMiles: 15,
};

export default function CreatePostModal({
  open,
  onClose,
  onSubmit,
  categories,
}: CreatePostModalProps) {
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  // change handler
  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'offerType' ? { catId: '' } : {}),
    }));
  };

  // submit handler for the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.catId || !formData.description) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        catId: Number(formData.catId),
        condition: formData.offerType === 'PRODUCT' ? formData.condition : undefined,
        zipCode: formData.isLocal ? formData.zipCode : undefined,
        radiusMiles: formData.isLocal ? Number(formData.radiusMiles) : undefined,
        images: [],
      });
      setFormData(initialForm);
      onClose();
    } catch (err) {
      console.error('Failed to submit post', err);
    } finally {
      setSubmitting(false);
    }
  };

  // check for valid data
  const isInvalid = !formData.title || !formData.name || !formData.catId || !formData.description;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
            />

            {/* Item / Service Name */}
            <TextField
              label="Item or Service Name"
              placeholder="e.g., Acoustic guitar or Guitar Lessons"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />

            {/* Type of Offer */}
            <RadioGroup
              row
              value={formData.offerType}
              onChange={(e) => handleChange('offerType', e.target.value)}
            >
              <FormControlLabel value="PRODUCT" control={<Radio />} label="Item / Product" />
              <FormControlLabel value="SERVICE" control={<Radio />} label="Service" />
            </RadioGroup>

            {/* Category Dropdown */}
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.catId}
                label="Category"
                onChange={(e) => handleChange('catId', Number(e.target.value))}
              >
                {categories
                  .filter((c) => c.type === formData.offerType)
                  .map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {/* Description */}
            <TextField
              label="Description"
              multiline
              rows={3}
              fullWidth
              required
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />

            {/* Condition (Product Only) */}
            <Collapse in={formData.offerType === 'PRODUCT'} unmountOnExit>
              <FormControl fullWidth>
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
            <FormControlLabel
              control={(
                <Switch
                  checked={formData.isLocal}
                  onChange={(e) => handleChange('isLocal', e.target.checked)}
                />
              )}
              label="Local Trade Only"
            />

            {/* Zip Code & Radius */}
            <Collapse in={formData.isLocal} unmountOnExit>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField
                    label="Zip Code"
                    fullWidth
                    required
                    value={formData.zipCode}
                    onChange={(e) => handleChange('zipCode', e.target.value)}
                  />
                </Grid>
                <Grid size={6}>
                  <FormControl fullWidth>
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
          <Button onClick={onClose} color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || isInvalid}
          >
            {submitting ? 'Posting...' : 'Create Post'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
