import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface TradeData {
  id: number;
  status: 'IN_PROGRESS' | 'WAITING_FOR_OTHER_USER' | 'COMPLETED' | 'CANCELLED';
  ownerId: number;
  requesterId: number;
  ownerCompl: boolean;
  reqCompl: boolean;
  createdAt: string;
  post: { id: number; title: string };
  owner: { id: number; name: string | null };
  requester: { id: number; name: string | null };
}

interface MyTradesProps {
  open: boolean;
  onClose: () => void;
}

export default function MyTrades({ open, onClose }: MyTradesProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const loadTrades = async () => {
    setLoading(true);
    try {
      const res = await axios.get<TradeData[]>('/trades/mine');
      setTrades(res.data);
    } catch {
      showToast('Could not load your trades.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadTrades();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleComplete = async (tradeId: number) => {
    setActingId(tradeId);
    try {
      await axios.patch(`/trades/${tradeId}/complete`);
      await loadTrades();
    } catch {
      showToast('Could not complete trade.', 'error');
    } finally {
      setActingId(null);
    }
  };

  const handleCancel = async (tradeId: number) => {
    setActingId(tradeId);
    try {
      await axios.patch(`/trades/${tradeId}/cancel`);
      await loadTrades();
    } catch {
      showToast('Could not cancel trade.', 'error');
    } finally {
      setActingId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>My Trades</DialogTitle>
      <DialogContent dividers>
        {loading && <CircularProgress size={24} />}

        {!loading && trades.length === 0 && (
          <Typography color="text.secondary">No trades yet.</Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {trades.map((trade) => {
            const isOwner = user?.id === trade.ownerId;
            const otherUser = isOwner ? trade.requester : trade.owner;
            const myCompl = isOwner ? trade.ownerCompl : trade.reqCompl;
            const canAct = trade.status === 'IN_PROGRESS' || trade.status === 'WAITING_FOR_OTHER_USER';

            return (
              <Card key={trade.id} variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {trade.post.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {`Trading with ${otherUser.name ?? 'Unknown user'} — Status: ${trade.status.replace(/_/g, ' ')}`}
                  </Typography>

                  {canAct && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                      <Button size="small" variant="contained" color="success" disabled={myCompl || actingId !== null} onClick={() => handleComplete(trade.id)}>
                        {myCompl ? 'Waiting on other user' : (actingId === trade.id ? 'Completing...' : 'Mark My Side Complete')}
                      </Button>
                      <Button size="small" variant="outlined" color="error" disabled={actingId !== null} onClick={() => handleCancel(trade.id)}>
                        Cancel Trade
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
