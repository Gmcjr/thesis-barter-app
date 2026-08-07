import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

import type { PendingTradeOffersProps, TradeData } from './types';

export default function PendingTradeOffers({
  onTradeActivity,
}:PendingTradeOffersProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState<number | null>(null);

  const loadTrades = useCallback(async () => {
    if (!user) {
      setTrades([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.get<TradeData[]>('/trades/mine');

      const activeTrades = Array.isArray(res.data)
        ? res.data.filter((trade) => (
          trade.status === 'IN_PROGRESS'
          || trade.status === 'WAITING_FOR_OTHER_USER'
        ))
        : [];

      setTrades(activeTrades);
    } catch (err) {
      console.error('Failed to load active trades:', err);
      setError('Could not load your active trades.');
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const handleComplete = async (tradeId: number) => {
    setActingId(tradeId);

    try {
      await axios.patch(`/trades/${tradeId}/complete`);
      showToast('Your side of the trade has been marked complete.', 'success');

      await Promise.all([
        loadTrades(),
        onTradeActivity(),
      ]);
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Could not complete trade.';

      showToast(message, 'error');
    } finally {
      setActingId(null);
    }
  };

  const handleCancel = async (tradeId: number) => {
    setActingId(tradeId);

    try {
      await axios.patch(`/trades/${tradeId}/cancel`);
      showToast('Trade cancelled.', 'info');

      await Promise.all([
        loadTrades(),
        onTradeActivity(),
      ]);
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Could not cancel trade.';

      showToast(message, 'error');
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (trades.length === 0) {
    return null;
  }

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', gap: 2,
    }}
    >
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        Trades in Progress:
      </Typography>

      {trades.map((trade) => {
        const isOwner = user?.id === trade.ownerId;
        const otherUser = isOwner ? trade.requester : trade.owner;
        const myCompl = isOwner ? trade.ownerCompl : trade.reqCompl;

        let completeButtonText = 'Mark My Side Complete';

        if (myCompl) {
          completeButtonText = 'Waiting on other user';
        } else if (actingId === trade.id) {
          completeButtonText = 'Completing...';
        }

        const cancelButtonText = actingId === trade.id
          ? 'Cancelling...'
          : 'Cancel Trade';

        return (
          <Card key={trade.id} variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {trade.post.title}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {`Trading with ${otherUser.name ?? 'Unknown user'} — Status: ${trade.status.replace(/_/g, ' ')}`}
              </Typography>

              <Box sx={{
                display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap',
              }}
              >
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  disabled={myCompl || actingId !== null}
                  onClick={() => handleComplete(trade.id)}
                >
                  {completeButtonText}
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  disabled={actingId !== null}
                  onClick={() => handleCancel(trade.id)}
                >
                  {cancelButtonText}
                </Button>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
