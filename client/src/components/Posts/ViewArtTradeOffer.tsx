/* eslint-disable react/jsx-one-expression-per-line */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CircularProgress from '@mui/material/CircularProgress';

interface TradeOffer {
  id: number;
  message: string;
  createdAt: string;
  status: string;
  previewUrl?: string | null;
  fullUrl?: string | null;
  offerer?: { id: number; name: string; email: string };
  post?: { id: number; title: string };
}

interface ViewArtTradeOfferProps {
  open: boolean;
  onClose: () => void;
  postId?: number | null;
}

export const ViewArtTradeOffer: React.FC<ViewArtTradeOfferProps> = ({ open, onClose, postId }) => {
  const [offers, setOffers] = useState<TradeOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    const fetchOffers = async () => {
      setLoading(true);
      setError('');

      try {
        const url = postId ? `/artTradeOffers?postId=${Number(postId)}` : '/artTradeOffers';
        const res = await axios.get(url, { withCredentials: true });

        const rawData = res.data;
        let normalizedOffers = [];

        if (Array.isArray(rawData)) {
          normalizedOffers = rawData;
        } else if (Array.isArray(rawData?.offers)) {
          normalizedOffers = rawData.offers;
        }

        setOffers(normalizedOffers);
      } catch (err) {
        console.error('Failed to load trade offers:', err);
        setError('Failed to load trade offers.');
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [open, postId]);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { xs: '90%', sm: 600 }, maxHeight: '80vh', bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Art Trade Offers
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Typography color="error">{error}</Typography>}

        {!loading && !error && offers.length === 0 && (
          <Typography color="text.secondary">No art trade offers found.</Typography>
        )}

        {!loading
          && offers.map((offer) => (
            <Card
              key={offer.id}
              variant="outlined"
              sx={{ borderRadius: 2, flexShrink: 0 }}
            >
              {offer.previewUrl && (
                <CardMedia
                  component="img"
                  image={offer.previewUrl}
                  alt="Offered Watermarked Art"
                  sx={{
                    width: '100%', height: 'auto', maxHeight: '350px', objectFit: 'contain', bgcolor: '#121212',
                  }}
                />
              )}
              <CardContent>
                {offer.post && (
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Offer For: {offer.post.title}
                  </Typography>
                )}
                {offer.offerer && (
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Offered by: {offer.offerer.name}
                  </Typography>
                )}
                <Typography variant="subtitle2" sx={{ my: 1 }}>
                  Offer Message: {offer.message || 'No details provided.'}
                </Typography>
              </CardContent>
            </Card>
          ))}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ViewArtTradeOffer;
