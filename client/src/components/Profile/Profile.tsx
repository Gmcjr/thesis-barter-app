import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Rating from '@mui/material/Rating';
import Chip from '@mui/material/Chip';

const profile = {
  name: 'Devin Delgado',
  memberSince: '7/15/1465',
  bio: 'I like wood. I like stone. I like bread. I love Barta',
  tradeCount: 4,
  rating: 4,
};

const dummyTrades = [
  {
    id: 3,
    user: 'Devin Delagdo',
    date: '07/20/1999',
    services: [
      {
        name: 'pedicure', description: 'pedicure',
      },
      {
        name: '8 hr rigourous military training session', description: '',
      },
    ],
    isComplete: true,
  },
  {
    id: 4,
    user: 'Devin Delagdo',
    date: '07/20/1999',
    product: [{ name: 'cloud', description: 'cloud', condition: 'new' }],
    services: [{ name: 'flight', description: 'fly' }],
    isComplete: false,
  },
];

export default function Profile() {
  const [activeTab, setActiveTab] = React.useState<'current' | 'history'>('current');

  return (
    <Box sx={{ width: '100%', mt: -4 }}>

      {/* Profile header: avatar, follow, bio card */}
      <Box sx={{
        display: 'flex',
        gap: 3,
        mb: 4,
        px: { xs: 2, md: 0 },
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
            {profile.name.charAt(0)}
          </Avatar>
          <Button
            variant="outlined"
            size="small"
            sx={{ borderRadius: 4, textTransform: 'none' }}
          >
            Follow
          </Button>
        </Box>

        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            borderColor: '#e0e0e0',
            flex: 1,
            minWidth: 260,
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 1.5,
              mb: 1,
              flexWrap: 'wrap',
            }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {profile.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Member since:
                {profile.memberSince}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              {profile.bio}
            </Typography>
          </CardContent>
        </Card>
      </Box>

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

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          ml: { md: 'auto' },
        }}
        >
          <Chip
            label={`${profile.tradeCount} Trades`}
            sx={{
              bgcolor: 'text.primary', color: 'background.paper', fontWeight: 600,
            }}
          />
          <Rating value={profile.rating} readOnly />
        </Box>
      </Box>

      {/* Trades section */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        px: { xs: 2, md: 0 },
      }}
      >
        {dummyTrades.map((trade) => (
          <Card key={trade.id} variant="outlined" sx={{ borderRadius: 3, borderColor: '#e0e0e0' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                flexWrap: 'wrap',
                gap: 1,
              }}
              >
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
                >
                  <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                    {trade.user.charAt(0)}
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {trade.user}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {`Posted on ${trade.date}`}
                </Typography>
              </Box>
              {trade.services?.map((service) => (
                <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                  {`${service.name}\n${service.description}`}
                </Typography>
              ))}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Comments..."
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 8 } }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ borderRadius: 4, textTransform: 'none', whiteSpace: 'nowrap' }}
                >
                  Open DM
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
