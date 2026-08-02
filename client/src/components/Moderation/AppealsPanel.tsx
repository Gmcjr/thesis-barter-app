import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useToast } from '../../context/ToastContext';
import { APPEAL_STATUS_OPTIONS, EMPTY_FILTERS, toQueryParams } from './format';
import AppealCard from './AppealCard';
import HistoryFilterBar from './HistoryFilterBar';
import useDebouncedValue from './useDebouncedValue';
import type { AppealRow, QueueFilters } from './types';

  type Scope = 'pending' | 'history';

export default function AppealsPanel() {
  const { showToast } = useToast();
  const [scope, setScope] = useState<Scope>('pending');
  const [filters, setFilters] = useState<QueueFilters>(EMPTY_FILTERS);
  const [rows, setRows] = useState<AppealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const debouncedFilters = useDebouncedValue(filters, 300);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAppeals() {
      setLoading(true);
      try {
        const res = await axios.get<AppealRow[]>('/appeals', {
          params: toQueryParams(scope, debouncedFilters, 'appellantQuery'),
          signal: controller.signal,
          withCredentials: true,
        });
        setRows(res.data);
      } catch (err) {
        if (!axios.isCancel(err)) showToast('Could not load appeals', 'error');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAppeals();
    return () => controller.abort();
  }, [scope, debouncedFilters, showToast]);

  const resolve = async (id: number, action: 'grant' | 'deny') => {
    setResolvingId(id);
    try {
      await axios.patch(`/appeals/${id}`, { action }, { withCredentials: true });
      showToast(
        action === 'grant' ? 'Appeal granted - content reinstated' : 'Appeal denied',
        'success',
      );
      setRows((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        showToast('This appeal was already resolved by someone else', 'warning');
        setRows((prev) => prev.filter((a) => a.id !== id));
      } else {
        showToast('Could not resolve appeal - check your connection and try again.', 'error');
      }
    } finally {
      setResolvingId(null);
    }
  };

  const isPending = scope === 'pending';

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button
          variant={isPending ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setScope('pending')}
        >
          Pending
        </Button>
        <Button
          variant={isPending ? 'outlined' : 'contained'}
          size="small"
          onClick={() => setScope('history')}
        >
          History
        </Button>
      </Box>

      {!isPending && (
      <HistoryFilterBar
        value={filters}
        onChange={setFilters}
        statusOptions={APPEAL_STATUS_OPTIONS}
        subjectLabel="Appellant"
      />
      )}

      {loading && (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
      )}

      {!loading && rows.length === 0 && (
      <Typography variant="body2" color="text.secondary">
        {isPending ? 'No appeals waiting for review.' : 'No resolved appeals match these filters.'}
      </Typography>
      )}

      {!loading && (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rows.map((appeal) => (
          <AppealCard
            key={appeal.id}
            appeal={appeal}
            showActions={isPending}
            resolvingId={resolvingId}
            onGrant={(id) => resolve(id, 'grant')}
            onDeny={(id) => resolve(id, 'deny')}
          />
        ))}
      </Box>
      )}
    </Box>
  );
}
