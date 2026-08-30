import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useToast } from '../../context/ToastContext';
import {
  EMPTY_FILTERS, REPORT_STATUS_OPTIONS, removalMessage, toQueryParams,
} from './format';
import HistoryFilterBar from './HistoryFilterBar';
import ReportCard from './ReportCard';
import useDebouncedValue from './useDebouncedValue';
import type { QueueFilters, ReportRow } from './types';

  type Scope = 'pending' | 'history';

export default function ReportsPanel() {
  const { showToast } = useToast();
  const [scope, setScope] = useState<Scope>('pending');
  const [filters, setFilters] = useState<QueueFilters>(EMPTY_FILTERS);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  // Debounces filters object to prevent API calls on every keystroke
  const debouncedFilters = useDebouncedValue(filters, 300);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReports() {
      setLoading(true);
      try {
        const res = await axios.get<ReportRow[]>('/reports', {
          params: toQueryParams(scope, debouncedFilters, 'reporteeQuery'),
          signal: controller.signal,
          withCredentials: true,
        });
        setRows(res.data);
      } catch (err) {
        // Aborted request is not a network failure and can be ignored
        if (!axios.isCancel(err)) showToast('Could not load reports', 'error');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadReports();
    return () => controller.abort();
  }, [scope, debouncedFilters, showToast]);

  const resolve = async (id: number, action: 'approve' | 'remove') => {
    setResolvingId(id);
    // Capture target row before it is filtered out for toast
    const target = rows.find((r) => r.id === id);
    try {
      await axios.patch(`/reports/${id}`, { action }, { withCredentials: true });
      let message = 'Report allowed';
      if (action === 'remove') message = target ? removalMessage(target) : 'Content removed';
      showToast(message, 'success');
      // Remove row since actions are only available in PENDING scope
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        showToast('This report was already resolved by someone else', 'warning');
        setRows((prev) => prev.filter((r) => r.id !== id));
      } else {
        showToast('Could not resolve report - check your connection and try again.', 'error');
      }
    } finally {
      setResolvingId(null);
    }
  };

  const isPending = scope === 'pending';

  return (
    <Box>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={scope}
        onChange={(_, next: Scope | null) => next && setScope(next)}
        sx={{ mb: 3 }}
      >
        <ToggleButton value="pending" sx={{ textTransform: 'none', px: 2 }}>
          Pending
        </ToggleButton>
        <ToggleButton value="history" sx={{ textTransform: 'none', px: 2 }}>
          History
        </ToggleButton>
      </ToggleButtonGroup>

      {!isPending && (
      <HistoryFilterBar
        value={filters}
        onChange={setFilters}
        statusOptions={REPORT_STATUS_OPTIONS}
        subjectLabel="Reportee"
      />
      )}

      {loading && (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
      )}

      {!loading && rows.length === 0 && (
      <Typography variant="body2" color="text.secondary">
        {isPending ? 'No reports waiting for review.' : 'No resolved reports match these filters.'}
      </Typography>
      )}

      {!loading && (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rows.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            showActions={isPending}
            resolvingId={resolvingId}
            onApprove={(id) => resolve(id, 'approve')}
            onRemove={(id) => resolve(id, 'remove')}
          />
        ))}
      </Box>
      )}
    </Box>
  );
}
