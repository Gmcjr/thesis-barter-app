import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';

interface ProfileTabsProps {
  activeTab: 'current' | 'history';
  onTabChange: (tab: 'current' | 'history') => void;
  tradeCount: number;
  isOwnProfile: boolean;
}

export default function ProfileTabs({
  activeTab, onTabChange, tradeCount, isOwnProfile,
}: ProfileTabsProps) {
  return (
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
        onClick={() => onTabChange('current')}
        sx={{ borderRadius: 8, textTransform: 'none', fontWeight: 600 }}
      >
        Current Trades
      </Button>
      <Button
        variant={activeTab === 'history' ? 'contained' : 'outlined'}
        disableElevation
        onClick={() => onTabChange('history')}
        sx={{ borderRadius: 8, textTransform: 'none', fontWeight: 600 }}
      >
        Trade History
      </Button>

      {!isOwnProfile && (
        <Button
          variant="outlined"
          sx={{ borderRadius: 8, textTransform: 'none' }}
        >
          DM
        </Button>
      )}

      <Box sx={{ ml: { md: 'auto' } }}>
        <Chip
          label={`${tradeCount} Trades`}
          sx={{
            bgcolor: 'text.primary', color: 'background.paper', fontWeight: 600,
          }}
        />
      </Box>
    </Box>
  );
}
