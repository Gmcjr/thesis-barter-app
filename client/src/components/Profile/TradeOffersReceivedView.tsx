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
import { useRouter } from '../../context/RouterContext';
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
  const [rejectingNormalId, setRejectingNormalId] = useState<number | null>(null);
  const [rejectingArtId, setRejectingArtId] = useState<number | null>(null);
  const { showToast } = useToast();
  const { navigate } = useRouter();

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

    document.getElementById(`offer-${highlightOfferId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
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

  const handleRejectNormalOffer = async (requestId: number) => {
    setRejectingNormalId(requestId);

    try {
      await axios.patch(`/trade-requests/${requestId}/reject`);
      showToast('Trade request rejected.', 'info');

      await Promise.all([
        loadOffers(),
        onOfferAccepted(),
      ]);
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Could not reject this trade request.';

      showToast(message, 'error');
    } finally {
      setRejectingNormalId(null);
    }
  };

  const handleRejectArtOffer = async (offerId: number) => {
    setRejectingArtId(offerId);

    try {
      await axios.patch(
        `/artTradeOffers/${offerId}/reject`,
        {},
        { withCredentials: true },
      );

      showToast('Art trade offer rejected.', 'info');

      await Promise.all([
        loadOffers(),
        onOfferAccepted(),
      ]);
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Could not reject this art trade offer.';

      showToast(message, 'error');
    } finally {
      setRejectingArtId(null);
    }
  };

  const handleOpenDM = async (userId: number) => {
    try {
      const response = await axios.post<{ id: number }>(
        '/dms',
        { userId },
        { withCredentials: true },
      );

      navigate(`/messages/${response.data.id}`);
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Could not start conversation.';

      showToast(message, 'error');
    }
  };

  const offerActionInProgress = acceptingNormalId !== null
    || acceptingArtId !== null
    || rejectingNormalId !== null
    || rejectingArtId !== null;

  const noOffers = normalOffers.length === 0 && artOffers.length === 0;

  const actionButtonSx = {
    minWidth: 0,
    px: 'clamp(6px, 1.5cqw, 14px)',
    py: 'clamp(3px, 0.7cqw, 6px)',
    fontSize: 'clamp(0.55rem, 1.45cqw, 0.875rem)',
    whiteSpace: 'nowrap',
    bgcolor: 'primary.main',
    color: 'primary.contrastText',
    '&:hover': {
      bgcolor: 'primary.dark',
    },
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(8px, 2cqw, 20px)',
        px: 'clamp(6px, 1.5cqw, 16px)',
        containerType: 'inline-size',
        width: '100%',
        minWidth: 0,
      }}
    >
      <PendingTradeOffers
        onTradeActivity={onOfferAccepted}
      />

      {loading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 'clamp(12px, 3cqw, 32px)',
          }}
        >
          <CircularProgress
            size="clamp(24px, 4cqw, 40px)"
          />
        </Box>
      )}

      {!loading && error && (
        <Alert
          severity="error"
          sx={{
            fontSize: 'clamp(0.6rem, 1.5cqw, 0.875rem)',
          }}
        >
          {error}
        </Alert>
      )}

      {!loading && !error && noOffers && (
        <Typography
          color="text.secondary"
          sx={{
            fontSize: 'clamp(0.65rem, 1.7cqw, 1rem)',
          }}
        >
          No pending offers received.
        </Typography>
      )}

      {!loading && !error && normalOffers.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(6px, 1.5cqw, 14px)',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              fontSize: 'clamp(0.8rem, 2.2cqw, 1.25rem)',
              lineHeight: 1.2,
            }}
          >
            Local Trade Offers:
          </Typography>

          {normalOffers.map((offer) => (
            <Card
              key={offer.id}
              variant="outlined"
              sx={{
                borderRadius: theme.radius.lg,
                flexShrink: 0,
                width: '100%',
                minWidth: 0,
              }}
            >
              <CardContent
                sx={{
                  p: 'clamp(8px, 2cqw, 16px)',
                  '&:last-child': {
                    pb: 'clamp(8px, 2cqw, 16px)',
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: 'clamp(0.6rem, 1.6cqw, 0.875rem)',
                    lineHeight: 1.3,
                  }}
                >
                  Offer For: {offer.post.title}
                </Typography>

                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: 'clamp(0.6rem, 1.6cqw, 0.875rem)',
                    lineHeight: 1.3,
                  }}
                >
                  Offered by: {offer.requester.name ?? offer.requester.email}
                </Typography>

                <Typography
                  variant="subtitle2"
                  sx={{
                    my: 'clamp(4px, 1cqw, 8px)',
                    fontSize: 'clamp(0.6rem, 1.6cqw, 0.875rem)',
                    lineHeight: 1.35,
                  }}
                >
                  Offer Message: {offer.message || 'No details provided.'}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 'clamp(4px, 1cqw, 8px)',
                    mt: 'clamp(5px, 1.2cqw, 10px)',
                    flexWrap: 'wrap',
                  }}
                >
                  <Button
                    variant="contained"
                    disabled={offerActionInProgress}
                    onClick={() => handleOpenDM(offer.requester.id)}
                    sx={actionButtonSx}
                  >
                    Open DM
                  </Button>

                  <Button
                    variant="contained"
                    disabled={offerActionInProgress}
                    onClick={() => handleRejectNormalOffer(offer.id)}
                    sx={actionButtonSx}
                  >
                    {rejectingNormalId === offer.id ? 'Rejecting...' : 'Reject Trade'}
                  </Button>

                  <Button
                    variant="contained"
                    disabled={offerActionInProgress}
                    onClick={() => handleAcceptNormalOffer(offer.id)}
                    sx={actionButtonSx}
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
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(6px, 1.5cqw, 14px)',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: 'clamp(0.8rem, 2.2cqw, 1.25rem)',
              lineHeight: 1.2,
            }}
          >
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
                width: '100%',
                minWidth: 0,
                ...(offer.id === highlightOfferId && {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                }),
              }}
            >
              {offer.previewUrl && (
                <Box
                  sx={{
                    width: '88%',
                    mx: 'auto',
                    mt: 'clamp(6px, 1.5cqw, 12px)',
                    aspectRatio: '2.8 / 1',
                    bgcolor: 'surface.sunken',
                    borderRadius: theme.radius.md,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CardMedia
                    component="img"
                    image={offer.previewUrl}
                    alt="Offered Watermarked Art"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              )}

              <CardContent
                sx={{
                  p: 'clamp(8px, 2cqw, 16px)',
                  '&:last-child': {
                    pb: 'clamp(8px, 2cqw, 16px)',
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: 'clamp(0.6rem, 1.6cqw, 0.875rem)',
                    lineHeight: 1.3,
                  }}
                >
                  Offer For: {offer.post.title}
                </Typography>

                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: 'clamp(0.6rem, 1.6cqw, 0.875rem)',
                    lineHeight: 1.3,
                  }}
                >
                  Offered by: {offer.offerer.name || offer.offerer.email}
                </Typography>

                <Typography
                  variant="subtitle2"
                  sx={{
                    my: 'clamp(4px, 1cqw, 8px)',
                    fontSize: 'clamp(0.6rem, 1.6cqw, 0.875rem)',
                    lineHeight: 1.35,
                  }}
                >
                  Offer Message: {offer.message || 'No details provided.'}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 'clamp(4px, 1cqw, 8px)',
                    mt: 'clamp(5px, 1.2cqw, 10px)',
                    flexWrap: 'wrap',
                  }}
                >
                  <Button
                    variant="contained"
                    disabled={offerActionInProgress}
                    onClick={() => handleOpenDM(offer.offerer.id)}
                    sx={actionButtonSx}
                  >
                    Open DM
                  </Button>

                  <Button
                    variant="contained"
                    disabled={offerActionInProgress}
                    onClick={() => handleRejectArtOffer(offer.id)}
                    sx={actionButtonSx}
                  >
                    {rejectingArtId === offer.id ? 'Rejecting...' : 'Reject Trade'}
                  </Button>

                  <Button
                    variant="contained"
                    onClick={() => handleAcceptArtOffer(offer.id)}
                    disabled={offerActionInProgress}
                    sx={actionButtonSx}
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
