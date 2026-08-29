import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useAuth } from '../../context/AuthContext';

/* Options are all related to dropdown filters the component */
const DISTANCE_OPTIONS = [
  5, 6, 7, 8, 9, 10, 15, 20, 30, 40,
  50, 60, 70, 80, 90, 100, 200, 300, '∞',
];

const TYPE_OPTIONS = [['PRODUCT', 'Item'], ['SERVICE', 'Service'], ['DIGITAL', 'Digital Art']];

const CONDITION_OPTIONS = [
  ['POOR', 'Poor'], ['AVERAGE', 'Average'], ['GOOD', 'Good'],
  ['EXCELLENT', 'Excellent'], ['MINT', 'Mint'],
];

const POPULARITY_OPTIONS = [
  ['24h', '24 hours'], ['1w', '1 week'], ['1m', '1 month'],
  ['1y', '1 year'], ['all', 'All time'],
];

const DATE_OPTIONS = [['before', 'Before'], ['after', 'After'], ['between', 'Between']];

/* Shared Select Menu Settings (prevents dropdowns from breaking/ controls their behavior) */
const SELECT_MENU_PROPS = {
  anchorOrigin: {
    vertical: 'bottom' as const,
    horizontal: 'left' as const,
  },
  transformOrigin: {
    vertical: 'top' as const,
    horizontal: 'left' as const,
  },
  slotProps: {
    paper: {
      sx: {
        maxHeight: 220,
        overflowY: 'auto',
      },
    },
  },
};

/* Date Helper */
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/* Reusable Filter Select */
function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  children: React.ReactNode;
}) {
  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        MenuProps={SELECT_MENU_PROPS}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </Select>
    </FormControl>
  );
}

/* Distance Value Display */
function DistanceValue({
  value,
  selected = false,
}: {
  value: string;
  selected?: boolean;
}) {
  return (
    <Box
      component="span"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '1em',
        textAlign: 'center',
        fontSize: 'inherit',
        lineHeight: 1,
      }}
    >
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: selected ? 'relative' : 'static',
          top: selected && value !== '∞' ? '2px' : 0,
          transformOrigin: 'center',
          transform: value === '∞'
            ? 'translateY(-1px) scale(1.6)'
            : 'none',
        }}
      >
        {value}
      </Box>
    </Box>
  );
}

/* Types */
export interface AdvancedSearchFilters {
  title: string;
  description: string;
  listingType: string;
  condition: string;
  hasImages: boolean;
  includeCompleted: boolean;
  sortBy: string;
  popularityPeriod: string;
  dateMode: string;
  dateStart: string;
  dateEnd: string;
  category: string;
  distanceRange: string;
  distancePostalCode: string;
}

interface CategoryCount {
  category: string;
  count: number;
}

interface SearchPostsAdvancedProps {
  open: boolean;
  onClose: () => void;
  filters: AdvancedSearchFilters;
  onApply: (filters: AdvancedSearchFilters) => void;
}

/* Default Filter Values */
export const EMPTY_ADVANCED_SEARCH: AdvancedSearchFilters = {
  title: '',
  description: '',
  listingType: '',
  condition: '',
  hasImages: false,
  includeCompleted: false,
  sortBy: '',
  popularityPeriod: '24h',
  dateMode: '',
  dateStart: '',
  dateEnd: '',
  category: '',
  distanceRange: '',
  distancePostalCode: '',
};

export default function SearchPostsAdvanced({
  open,
  onClose,
  filters,
  onApply,
}: SearchPostsAdvancedProps) {
  /* User and Filter State */
  const { user } = useAuth();

  const [draft, setDraft] = useState<AdvancedSearchFilters>(filters);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [distanceMenuMaxHeight, setDistanceMenuMaxHeight] = useState(220);
  const distanceSelect = useRef<HTMLDivElement | null>(null);

  /* Filter Validation */
  const canSearchDistance = user?.lat != null && user?.lng != null;

  const distancePostalCodeMissing = (
    canSearchDistance
    && draft.distanceRange !== '∞'
    && !draft.distancePostalCode.trim()
  );

  const dateMissing = (
    (draft.dateMode === 'before' || draft.dateMode === 'after')
    && !draft.dateStart
  ) || (
    draft.dateMode === 'between'
    && (!draft.dateStart || !draft.dateEnd)
  );

  const dateRangeInvalid = (
    draft.dateMode === 'between'
    && Boolean(draft.dateStart)
    && Boolean(draft.dateEnd)
    && draft.dateStart > draft.dateEnd
  );

  /* Initialize Filters and Load Categories */
  useEffect(() => {
    if (!open) return;

    setDraft({
      ...filters,
      popularityPeriod: filters.popularityPeriod || '24h',
      dateEnd: filters.dateEnd || getTodayDate(),
      distanceRange: filters.distanceRange || '5',
      distancePostalCode: filters.distancePostalCode || user?.zipCode || '',
    });

    axios.get<CategoryCount[]>('/posts/categories')
      .then((response) => setCategories(response.data))
      .catch((requestError) => {
        console.error('Failed to load categories:', requestError);
        setCategories([]);
      });
  }, [open, filters, user?.zipCode]);

  /* Filter Handlers */
  const updateDraft = (changes: Partial<AdvancedSearchFilters>) => {
    setDraft((current) => ({ ...current, ...changes }));
  };

  const handleApply = () => {
    if (dateMissing || dateRangeInvalid || distancePostalCodeMissing) return;
    onApply(draft);
  };

  const updateDistanceMenuHeight = () => {
    if (!distanceSelect.current) return;

    const { bottom } = distanceSelect.current.getBoundingClientRect();
    const availableHeight = window.innerHeight - bottom - 8;

    setDistanceMenuMaxHeight(Math.min(220, Math.max(0, availableHeight)));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            m: { xs: 1, sm: 4 },
            width: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 64px)' },
          },
        },
      }}
    >
      <DialogTitle>Advanced Search</DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Search by Title */}
          <TextField
            label="Search by Title"
            fullWidth
            value={draft.title}
            onChange={(event) => updateDraft({ title: event.target.value })}
          />

          {/* Search by Description */}
          <TextField
            label="Search by Description"
            fullWidth
            value={draft.description}
            onChange={(event) => updateDraft({ description: event.target.value })}
          />

          {/* Search by Category */}
          <FilterSelect
            label="Search by Category"
            value={draft.category}
            onChange={(value) => updateDraft({ category: value })}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.category} value={category.category}>
                {category.category}
                {' '}
                (
                {category.count}
                )
              </MenuItem>
            ))}
          </FilterSelect>

          {/* Search by Type */}
          <FilterSelect
            label="Search by Type"
            value={draft.listingType}
            onChange={(value) => updateDraft({
              listingType: value,
              condition: value === 'PRODUCT' ? draft.condition : '',
            })}
          >
            <MenuItem value="">Any Type</MenuItem>
            {TYPE_OPTIONS.map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </FilterSelect>

          {/* Condition (Product Only) */}
          {draft.listingType === 'PRODUCT' && (
            <FilterSelect
              label="Condition"
              value={draft.condition}
              onChange={(value) => updateDraft({ condition: value })}
            >
              <MenuItem value="">Any Condition</MenuItem>
              {CONDITION_OPTIONS.map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </FilterSelect>
          )}

          {/* Image, Completed Trade, and Sort Options */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.75,
              width: '100%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                width: '100%',
              }}
            >
              {/* Has Images */}
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={draft.hasImages}
                    onChange={(event) => updateDraft({ hasImages: event.target.checked })}
                  />
                )}
                label="Has images"
                sx={{ m: 0 }}
              />
              {/* Include completed trades */}
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={draft.includeCompleted}
                    onChange={(event) => updateDraft({ includeCompleted: event.target.checked })}
                  />
                )}
                label="Include completed trades"
                sx={{ m: 0 }}
              />
            </Box>

            {/* Sort Options- Most Popular and Recently Updated */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                width: '100%',
                whiteSpace: 'nowrap',
              }}
            >
              <Typography sx={{ flexShrink: 0, fontSize: '0.95rem' }}>
                Sort by:
              </Typography>

              <RadioGroup
                row
                value={draft.sortBy}
                onChange={(event) => updateDraft({ sortBy: event.target.value })}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexWrap: 'nowrap',
                  gap: 1,
                }}
              >
                <FormControlLabel
                  value="updated"
                  control={<Radio size="small" sx={{ p: 0.75 }} />}
                  label="Most recent updates"
                  sx={{
                    m: 0,
                    '& .MuiFormControlLabel-label': {
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                    },
                  }}
                />

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    flexShrink: 0,
                  }}
                >
                  <FormControlLabel
                    value="popularity"
                    control={<Radio size="small" sx={{ p: 0.75 }} />}
                    label="Most popular within"
                    sx={{
                      m: 0,
                      '& .MuiFormControlLabel-label': {
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap',
                      },
                    }}
                  />

                  <FormControl
                    size="small"
                    disabled={draft.sortBy !== 'popularity'}
                    sx={{ width: 105, flexShrink: 0 }}
                  >
                    <Select
                      value={draft.popularityPeriod}
                      MenuProps={SELECT_MENU_PROPS}
                      onChange={(event) => updateDraft({
                        popularityPeriod: event.target.value,
                      })}
                      sx={{ fontSize: '0.9rem', height: 40 }}
                    >
                      {POPULARITY_OPTIONS.map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </RadioGroup>
            </Box>
          </Box>

          {/* Date Added */}
          <FilterSelect
            label="Date Added"
            value={draft.dateMode}
            onChange={(value) => updateDraft({
              dateMode: value,
              dateStart: value ? draft.dateStart : '',
              dateEnd: value === 'between'
                ? draft.dateEnd || getTodayDate()
                : draft.dateEnd,
            })}
          >
            <MenuItem value="">Any Time</MenuItem>
            {DATE_OPTIONS.map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </FilterSelect>

          {/* Single Date */}
          {(draft.dateMode === 'before' || draft.dateMode === 'after') && (
            <TextField
              label="Date"
              type="date"
              fullWidth
              value={draft.dateStart}
              onChange={(event) => updateDraft({ dateStart: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}

          {/* Date Range */}
          {draft.dateMode === 'between' && (
            <>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={draft.dateStart}
                onChange={(event) => updateDraft({ dateStart: event.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                label="End Date"
                type="date"
                fullWidth
                value={draft.dateEnd}
                error={dateRangeInvalid}
                helperText={dateRangeInvalid
                  ? 'End date must be on or after the start date.'
                  : ''}
                onChange={(event) => updateDraft({ dateEnd: event.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </>
          )}

          {/* Location Based Filtering */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              width: '100%',
              flexWrap: 'wrap',
            }}
          >
            <Typography sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
              Less than
            </Typography>

            <FormControl
              ref={distanceSelect}
              disabled={!canSearchDistance}
              size="small"
              sx={{ minWidth: 90, width: 90, flexShrink: 0 }}
            >
              <Select
                value={draft.distanceRange || '5'}
                onOpen={updateDistanceMenuHeight}
                MenuProps={{
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  marginThreshold: null,
                  slotProps: {
                    paper: {
                      sx: {
                        maxHeight: distanceMenuMaxHeight,
                        overflowY: 'auto',
                      },
                    },
                  },
                }}
                renderValue={(value) => (
                  <DistanceValue value={value} selected />
                )}
                onChange={(event) => updateDraft({
                  distanceRange: event.target.value,
                })}
              >
                {DISTANCE_OPTIONS.map((distance) => (
                  <MenuItem
                    key={distance}
                    value={String(distance)}
                    sx={{ justifyContent: 'center' }}
                  >
                    <DistanceValue value={String(distance)} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
              miles
            </Typography>

            <Typography sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
              from postal code
            </Typography>

            <TextField
              disabled={!canSearchDistance}
              size="small"
              value={draft.distancePostalCode}
              onChange={(event) => updateDraft({
                distancePostalCode: event.target.value,
              })}
              sx={{ width: 120, flexShrink: 0 }}
            />
          </Box>
        </Box>
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={dateMissing || dateRangeInvalid || distancePostalCodeMissing}
          onClick={handleApply}
        >
          Search
        </Button>
      </DialogActions>
    </Dialog>
  );
}
