import React, { useEffect, useState } from 'react';
import axios from 'axios';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Rating from '@mui/material/Rating';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';

import { useParams } from '../../context/RouterContext';

interface ProfileUser {
  id: number;
  name: string;
  email: string;
  bio: string | null;
  createdAt: string;
}

interface DummyComment {
  id: number;
  user: string;
  text: string;
  createdAt: string;
}

interface DummyProduct {
  id: number;
  name: string;
  description: string;
  condition: 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT' | 'MINT';
}

interface DummyService {
  id: number;
  name: string;
  description: string;
}

interface DummyPost {
  id: number;
  user: string;
  title: string;
  message: string;
  isComplete: boolean;
  createdAt: string;
  products: DummyProduct[];
  services: DummyService[];
  comments: DummyComment[];
}

const dummyTrades: DummyPost[] = [
  {
    id: 3,
    user: 'Devin Delagdo',
    title: 'Pedicure + training sesh',
    message: 'Looking for a workout partner. Will give u a pedicure!',
    isComplete: true,
    createdAt: '1999-07-20T00:00:00.000Z',
    products: [],
    services: [
      { id: 1, name: 'Pedicure', description: 'Full pedicure session' },
      { id: 2, name: '8 hr rigorous military training session', description: '' },
    ],
    comments: [
      {
        id: 1,
        user: 'pedro',
        text: 'Is this still available?',
        createdAt: '1999-07-21T00:00:00.000Z',
      },
    ],
  },
  {
    id: 4,
    user: 'Devin Delagdo',
    title: 'Cloud',
    message: 'Trading a cloud (with test flight)',
    isComplete: false,
    createdAt: '1999-07-20T00:00:00.000Z',
    products: [
      {
        id: 1,
        name: 'Cloud',
        description: 'A cloud',
        condition: 'MINT',
      },
    ],
    services: [
      { id: 1, name: 'Test Flight', description: 'Assisstance provided for first flight only.' },
    ],
    comments: [],
  },
];

export default function Profile() {
  const [activeTab, setActiveTab] = React.useState<'current' | 'history'>('current');
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { id } = useParams();

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      try {
        const url = id ? `/user/${id}` : '/user/me';
        const res = await axios.get<ProfileUser>(url, { withCredentials: true });
        if (!cancelled) setProfile(res.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong :/');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfile();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        mt: 8,
      }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box sx={{
        mt: 8,
        textAllign: 'center',
      }}
      >
        <Typography color="error">{error ?? 'Profile not found'}</Typography>
      </Box>
    );
  }

  const visibleTrades = dummyTrades.filter((trade) => (
    activeTab === 'current' ? !trade.isComplete : trade.isComplete
  ));

  return (
    <Box sx={{ width: '100%', mt: -4 }}>

      {/* Profile header: avatar, follow, bio card */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: '#e0e0e0',
          mb: 4,
          mx: { xs: 2, md: 0 },
        }}
      >
        <CardContent sx={{
          p: { xs: 2, sm: 3 },
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
        }}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
          >
            <Avatar sx={{
              width: 88,
              height: 88,
              bgcolor: 'primary.main',
              fontSize: '2rem',
            }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </Avatar>
            <Button
              variant="outlined"
              size="small"
              sx={{ borderRadius: 4, textTransform: 'none' }}
            >
              Follow
            </Button>
          </Box>

          <Box sx={{ flex: 1, minWidth: 260 }}>
            <Typography variant="h1" sx={{ fontWeight: 300, fontSize: 30 }}>
              {profile.name}
            </Typography>
            <Typography variant="h1" sx={{ fontWeight: 300, fontSize: 15 }}>
              {profile.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {`User since ${new Date(profile.createdAt).toLocaleDateString()}`}
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6, mt: 1.5 }}>
              {profile.bio ?? ''}
            </Typography>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              ml: { md: 'auto' },
            }}
            >
              <Chip
                label={`${2} Trades`}
                sx={{
                  bgcolor: 'text.primary', color: 'background.paper', fontWeight: 600,
                }}
              />
              <Rating value={4} readOnly />
              {/* CHANGE RATING AND TRADES # */}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Trades header: activeTab toggle, DM, trade count, rating */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        mb: 3,
        px: { xs: 2, md: 0 },
        flexWrap: 'wrap',
      }}
      >
        <Button
          variant={activeTab === 'current' ? 'contained' : 'outlined'}
          disableElevation
          onClick={() => setActiveTab('current')}
          sx={{ borderRadius: 8, textTransform: 'none', fontWeight: 600 }}
        >
          Current Trades
        </Button>
        <Button
          variant={activeTab === 'history' ? 'contained' : 'outlined'}
          disableElevation
          onClick={() => setActiveTab('history')}
          sx={{ borderRadius: 8, textTransform: 'none', fontWeight: 600 }}
        >
          Trade History
        </Button>
        <Button
          variant="outlined"
          sx={{ borderRadius: 8, textTransform: 'none' }}
        >
          DM
        </Button>

      </Box>

      {/* Trades section */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        px: { xs: 2, md: 0 },
      }}
      >
        {visibleTrades.map((trade) => (
          <Card key={trade.id} variant="outlined" sx={{ borderRadius: 3, borderColor: '#e0e0e0' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1,
              }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                    {trade.user.charAt(0)}
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {trade.user}
                  </Typography>
                  <Button size="small" variant="outlined" sx={{ borderRadius: 4, textTransform: 'none' }}>
                    Open DM
                  </Button>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {`Posted on ${new Date(trade.createdAt).toLocaleDateString()}`}
                </Typography>
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                {trade.title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                {trade.message}
              </Typography>

              {trade.products.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                    Products
                  </Typography>
                  {trade.products.map((product) => (
                    <Typography key={product.id} variant="body2" sx={{ lineHeight: 1.6 }}>
                      {`${product.name} (${product.condition}) — ${product.description}`}
                    </Typography>
                  ))}
                </Box>
              )}

              {trade.services.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                    Services
                  </Typography>
                  {trade.services.map((service) => (
                    <Typography key={service.id} variant="body2" sx={{ lineHeight: 1.6 }}>
                      {`${service.name}${service.description ? ` — ${service.description}` : ''}`}
                    </Typography>
                  ))}
                </Box>
              )}

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
                Comments
              </Typography>

              {trade.comments.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {trade.comments.map((comment) => (
                    <Box
                      key={comment.id}
                      sx={{
                        display: 'flex', gap: 2, alignItems: 'flex-start', p: 1.5, bgcolor: '#f4f6f8', borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        <strong>
                          {comment.user}
                        </strong>
                        {`: ${comment.text}`}
                      </Typography>
                      <Button size="small" sx={{ textTransform: 'none', minWidth: 'auto' }}>DM</Button>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.disabled" sx={{ mb: 2, fontStyle: 'italic' }}>
                  No comments...
                </Typography>
              )}

              <Box sx={{ display: 'flex', mt: 3, gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Add a comment..."
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
                />
                <Button variant="contained" disableElevation sx={{ borderRadius: 8, textTransform: 'none' }}>
                  Send
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
