import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
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
  const setField = (field: keyof QueueFilters, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const isDirty = Object.values(value).some((v) => v !== '');

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
        },
        gap: 1.5,
        mb: 3,
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

      {isDirty && (
      <Box sx={{ gridColumn: '1 / -1' }}>
        <Button size="small" onClick={() => onChange(EMPTY_FILTERS)}>
          Clear filters
        </Button>
      </Box>
      )}
    </Box>
  );
}
