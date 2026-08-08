import React, { useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { radius } from '../../theme';
import { useToast } from '../../context/ToastContext';

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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get<IncomingRequest[]>(`/trade-requests/for-post/${postId}`);
      setRequests(res.data);
    } catch {
      showToast('Could not load trade requests.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadRequests();
  };

  const handleAccept = async (requestId: number) => {
    setAcceptingId(requestId);
    try {
      await axios.patch(`/trade-requests/${requestId}/accept`);
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

          {!loading && pendingRequests.length === 0 && (
            <Typography variant="body2" color="text.secondary">No pending requests yet.</Typography>
          )}

          {!loading && pendingRequests.map((request) => (
            <Box
              key={request.id}
              sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'surface.sunken', borderRadius: radius.md, gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {request.requester.name ?? request.requester.email}
                </Typography>
                {request.message && (
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>{request.message}</Typography>
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
