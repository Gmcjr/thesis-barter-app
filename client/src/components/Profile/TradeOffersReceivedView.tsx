/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line */
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { useToast } from '../../context/ToastContext';
import PendingTradeOffers from './PendingTradeOffers';

import type { ArtTradeOfferData, NormalTradeOffer, TradeOffersReceivedViewProps } from './types';

export default function TradeOffersReceivedView({
  onOfferAccepted, highlightOfferId,
}: TradeOffersReceivedViewProps) {
  const theme = useTheme();
  const [normalOffers, setNormalOffers] = useState<NormalTradeOffer[]>([]);
  const [artOffers, setArtOffers] = useState<ArtTradeOfferData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acceptingNormalId, setAcceptingNormalId] = useState<number | null>(null);
  const [acceptingArtId, setAcceptingArtId] = useState<number | null>(null);
  const { showToast } = useToast();

  const loadOffers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [normalOffersRes, artOffersRes] = await Promise.all([
        axios.get<NormalTradeOffer[]>('/trade-requests/received'),
        axios.get<ArtTradeOfferData[]>('/artTradeOffers', {
          withCredentials: true,
        }),
      ]);

      setNormalOffers(
        Array.isArray(normalOffersRes.data)
          ? normalOffersRes.data.filter((offer) => offer.status === 'PENDING')
          : [],
      );

      setArtOffers(
        Array.isArray(artOffersRes.data)
          ? artOffersRes.data.filter((offer) => offer.status === 'PENDING')
          : [],
      );
    } catch (err) {
      console.error('Failed to load received offers:', err);
      setError('Could not load your received offers.');
      setNormalOffers([]);
      setArtOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  useEffect(() => {
    if (!highlightOfferId || loading) return;
    document.getElementById(`offer-${highlightOfferId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightOfferId, loading, artOffers]);

  const handleAcceptNormalOffer = async (requestId: number) => {
    setAcceptingNormalId(requestId);

    try {
      await axios.patch(`/trade-requests/${requestId}/accept`);
      showToast('Trade accepted!', 'success');

      await Promise.all([
        loadOffers(),
        onOfferAccepted(),
      ]);
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Could not accept this trade request.';

      showToast(message, 'error');
    } finally {
      setAcceptingNormalId(null);
    }
  };

  const handleAcceptArtOffer = async (offerId: number) => {
    setAcceptingArtId(offerId);

    try {
      await axios.patch(
        `/artTradeOffers/${offerId}/accept`,
        {},
        { withCredentials: true },
      );

      showToast('Art trade accepted!', 'success');

      await Promise.all([
        loadOffers(),
        onOfferAccepted(),
      ]);
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Could not accept this art trade offer.';

      showToast(message, 'error');
    } finally {
      setAcceptingArtId(null);
    }
  };

  const acceptingOffer = acceptingNormalId !== null || acceptingArtId !== null;
  const noOffers = normalOffers.length === 0 && artOffers.length === 0;

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', gap: 3, px: { xs: 2, md: 0 },
    }}
    >
      <PendingTradeOffers
        onTradeActivity={onOfferAccepted}
      />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && noOffers && (
        <Typography color="text.secondary">No pending offers received.</Typography>
      )}

      {!loading && !error && normalOffers.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Local Trade Offers:
          </Typography>

          {normalOffers.map((offer) => (
            <Card
              key={offer.id}
              variant="outlined"
              sx={{ borderRadius: theme.radius.lg, flexShrink: 0 }}
            >
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Offer For: {offer.post.title}
                </Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Offered by: {offer.requester.name ?? offer.requester.email}
                </Typography>

                <Typography variant="subtitle2" sx={{ my: 1 }}>
                  Offer Message: {offer.message || 'No details provided.'}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={acceptingOffer}
                    onClick={() => handleAcceptNormalOffer(offer.id)}
                  >
                    {acceptingNormalId === offer.id ? 'Accepting...' : 'Accept Trade'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {!loading && !error && artOffers.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6">
            Digital Trade Offers:
          </Typography>

          {artOffers.map((offer) => (
            <Card
              key={offer.id}
              id={`offer-${offer.id}`}
              variant="outlined"
              sx={{
                borderRadius: theme.radius.lg,
                flexShrink: 0,
                ...(offer.id === highlightOfferId && { outline: '2px solid', outlineColor: 'primary.main' }),
              }}
            >
              {offer.previewUrl && (
                <CardMedia
                  component="img"
                  image={offer.previewUrl}
                  alt="Offered Watermarked Art"
                  sx={{
                    width: '100%', height: 'auto', maxHeight: '350px', objectFit: 'contain', bgcolor: 'surface.sunken',
                  }}
                />
              )}

              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Offer For: {offer.post.title}
                </Typography>

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Offered by: {offer.offerer.name || offer.offerer.email}
                </Typography>

                <Typography variant="subtitle2" sx={{ my: 1 }}>
                  Offer Message: {offer.message || 'No details provided.'}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleAcceptArtOffer(offer.id)}
                    disabled={acceptingOffer}
                  >
                    {acceptingArtId === offer.id ? 'Accepting...' : 'Accept Trade'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
