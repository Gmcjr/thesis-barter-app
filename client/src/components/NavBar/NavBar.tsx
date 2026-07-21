import React from 'react';
import {
  AppBar, Toolbar, Typography, Button, InputBase, Box, Paper, Avatar,
} from '@mui/material';

function NavBar() {
  return (
    <AppBar position="fixed" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
      <Toolbar sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1,
        px: { xs: 1.5, sm: 3, md: 4 },
        gap: { xs: 1, sm: 2 },
        flexWrap: { xs: 'wrap', md: 'nowrap' },
      }}
      >

        {/* App Name (maybe logo later?) */}
        <Typography
          variant="h6"
          color="primary.main"
          sx={{
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            flexShrink: 0,
          }}
        >
          BarterApp
        </Typography>

        {/* Search Bar */}
        <Paper
          variant="outlined"
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            py: 0.25,
            flex: { xs: '1 1 100%', md: '0 1 400px' },
            order: { xs: 3, md: 2 },
          }}
        >
          <InputBase placeholder="Search for listings..." sx={{ flex: 1, fontSize: '0.85rem' }} />
        </Paper>

        {/* Home, Messages and Profile */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 2 },
          flexShrink: 0,
          order: { xs: 2, md: 3 },
        }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            <Button variant="text" color="inherit" size="small" sx={{ minWidth: 'auto', px: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Home</Button>
            <Button variant="text" color="inherit" size="small" sx={{ minWidth: 'auto', px: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Messages</Button>
            <Button variant="text" color="inherit" size="small" sx={{ minWidth: 'auto', px: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Profile</Button>
          </Box>

          {/* User Profile Section- using placeholders presently, will need to update later */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1, pl: 1, borderLeft: '1px solid', borderColor: 'divider', flexShrink: 0,
          }}
          >
            <Avatar sx={{
              width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem',
            }}
            >
              C
            </Avatar>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Claire
            </Typography>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default NavBar;
