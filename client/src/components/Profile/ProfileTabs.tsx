import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import type { ProfileTabsProps } from './types';

export default function ProfileTabs({
  activeTab, onTabChange, isOwnProfile, onDM,
}: ProfileTabsProps) {
  const theme = useTheme();
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
        sx={{ borderRadius: theme.radius.md, textTransform: 'none', fontWeight: 600 }}
      >
        Current Trades
      </Button>
      <Button
        variant={activeTab === 'history' ? 'contained' : 'outlined'}
        disableElevation
        onClick={() => onTabChange('history')}
        sx={{ borderRadius: theme.radius.md, textTransform: 'none', fontWeight: 600 }}
      >
        Trade History
      </Button>

      {isOwnProfile && (
        <Button
          variant={activeTab === 'offers' ? 'contained' : 'outlined'}
          disableElevation
          onClick={() => onTabChange('offers')}
          sx={{ borderRadius: theme.radius.pill, textTransform: 'none', fontWeight: 600 }}
        >
          Offers Received
        </Button>
      )}

      {!isOwnProfile && (
        <Button
          variant="outlined"
          onClick={onDM}
          sx={{ borderRadius: theme.radius.md, textTransform: 'none' }}
        >
          DM
        </Button>
      )}
    </Box>
  );
}
