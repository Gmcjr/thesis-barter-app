import React, { useState } from 'react';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import FilterListIcon from '@mui/icons-material/FilterList';
import { EMPTY_FILTERS, REPORT_REASONS, humanizeReason } from './format';
import type { StatusOption } from './format';
import type { QueueFilters } from './types';

  interface Props {
    value: QueueFilters;
    onChange: (next: QueueFilters) => void;
    statusOptions: StatusOption[];
    subjectLabel: string;
  }

export default function HistoryFilterBar({
  value, onChange, statusOptions, subjectLabel,
}: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const setField = (field: keyof QueueFilters, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const isDirty = Object.values(value).some((v) => v !== '');

  return (
    <Box
      sx={{ mb: 3 }}
    >
      <Badge color="primary" variant="dot" invisible={!isDirty}>
        <Tooltip title="Filter">
          <IconButton
            size="small"
            aria-label={isDirty ? 'Filter - filters active' : 'Filter'}
            aria-haspopup="dialog"
            aria-expanded={!!anchorEl}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Badge>

      <Popover
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              width: 280, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5,
            },
          },
        }}
      >
        <TextField
          select
          size="small"
          label="Status"
          value={value.status}
          onChange={(e) => setField('status', e.target.value)}
        >
          {statusOptions.map((option) => (
            <MenuItem key={option.value || 'ALL'} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Category"
          value={value.reason}
          onChange={(e) => setField('reason', e.target.value)}
        >
          <MenuItem value="">All categories</MenuItem>
          {REPORT_REASONS.map((reason) => (
            <MenuItem key={reason} value={reason}>
              {humanizeReason(reason)}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          label="Reporter"
          placeholder="Name contains..."
          value={value.reporterQuery}
          onChange={(e) => setField('reporterQuery', e.target.value)}
        />

        <TextField
          size="small"
          label={subjectLabel}
          placeholder="Name contains..."
          value={value.subjectQuery}
          onChange={(e) => setField('subjectQuery', e.target.value)}
        />

        <TextField
          size="small"
          type="date"
          label="From"
          value={value.dateFrom}
          onChange={(e) => setField('dateFrom', e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          size="small"
          type="date"
          label="To"
          value={value.dateTo}
          onChange={(e) => setField('dateTo', e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <Button size="small" disabled={!isDirty} onClick={() => onChange(EMPTY_FILTERS)}>
          Clear filters
        </Button>
      </Popover>
    </Box>
  );
}
