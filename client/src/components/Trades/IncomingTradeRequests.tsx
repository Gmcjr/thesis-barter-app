import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { radius } from '../../theme';
import { useToast } from '../../context/ToastContext';
import { useRouter, useParams } from '../../context/RouterContext';
import UserAvatar from '../common/UserAvatar';

interface IncomingRequest {
  id: number;
  message: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  requester: { id: number; name: string | null; email: string };
}

interface IncomingTradeRequestsProps {
  postId: number;
  onAccepted: () => void | Promise<void>;
}

export default function IncomingTradeRequests({ postId, onAccepted }: IncomingTradeRequestsProps) {
  const { requestId } = useParams();
  const highlightRequestId = requestId ? Number(requestId) : undefined;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const { showToast } = useToast();
  const { navigate } = useRouter();

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<IncomingRequest[]>(`/trade-requests/for-post/${postId}`);
      setRequests(res.data);
    } catch {
      showToast('Could not load trade requests.', 'error');
    } finally {
      setLoading(false);
    }
  }, [postId, showToast]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadRequests();
  };

  useEffect(() => {
    if (highlightRequestId) {
      setOpen(true);
      loadRequests();
    }
  }, [highlightRequestId, loadRequests]);

  const handleAccept = async (tradeRequestId: number) => {
    setAcceptingId(tradeRequestId);
    try {
      await axios.patch(`/trade-requests/${tradeRequestId}/accept`);
      showToast('Trade accepted!', 'success');
      setOpen(false);
      await onAccepted();
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Could not accept this request.';
      showToast(message, 'error');
    } finally {
      setAcceptingId(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const highlightTarget = highlightRequestId
    ? requests.find((r) => r.id === highlightRequestId)
    : undefined;
  const highlightNotFound = !!highlightRequestId && !loading && !highlightTarget;
  const highlightCancelled = highlightTarget?.status === 'CANCELLED';

  return (
    <Box sx={{ mt: 2, pt: 2 }}>
      <Button size="small" variant="outlined" onClick={handleToggle} sx={{ borderRadius: radius.md, textTransform: 'none' }}>
        {open ? 'Hide Trade Requests' : 'View Trade Requests'}
      </Button>

      {open && (
        <Box sx={{
          mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1,
        }}
        >
          {loading && <CircularProgress size={20} />}

          {highlightNotFound && (
            <Alert severity="info">This trade request is no longer available.</Alert>
          )}
          {highlightCancelled && (
            <Alert severity="info">This trade request was withdrawn by the requester.</Alert>
          )}

          {!loading && pendingRequests.length === 0 && (
            <Typography variant="body2" color="text.secondary">No pending requests yet.</Typography>
          )}

          {!loading && pendingRequests.map((request) => (
            <Box
              key={request.id}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1.5,
                bgcolor: 'surface.sunken',
                borderRadius: radius.md,
                gap: 2,
                ...(request.id === highlightRequestId && { outline: '2px solid', outlineColor: 'primary.main' }),
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Box
                  onClick={() => navigate(`/profile/${request.requester.id}`)}
                  role="button"
                  tabIndex={0}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    width: 'fit-content',
                    cursor: 'pointer',
                    '&:hover .requester-name': { textDecoration: 'underline' },
                  }}
                >
                  <UserAvatar user={request.requester} size={32} />
                  <Typography variant="body2" className="requester-name" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {request.requester.name ?? request.requester.email}
                  </Typography>
                </Box>
                {request.message && (
                  <Typography variant="body2" sx={{ color: 'text.primary', mt: 0.5 }}>{request.message}</Typography>
                )}
              </Box>
              <Button size="small" variant="contained" color="success" disabled={acceptingId !== null} onClick={() => handleAccept(request.id)}>
                {acceptingId === request.id ? 'Accepting...' : 'Accept'}
              </Button>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
