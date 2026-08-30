import React from 'react';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';

import { Link } from '../../context/RouterContext';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        px: { xs: 1, sm: 2 },
        py: 1,
        minHeight: { xs: 86, sm: 96 },
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          maxWidth: 850,
          width: '100%',
          mx: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'nowrap',
          gap: { xs: 1, sm: 2 },
          '& a': {
            color: 'text.primary',
            textDecoration: 'none',
            fontSize: { xs: '0.68rem', sm: '1.1rem' },
            whiteSpace: 'nowrap',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.75, sm: 2 },
            flexShrink: 1,
            minWidth: 0,
          }}
        >
          <Avatar
            variant="rounded"
            src={new URL('../../assets/BartaMascot.png', import.meta.url).href}
            alt="Barta"
            sx={{
              width: { xs: 48, sm: 80 },
              height: { xs: 48, sm: 80 },
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          />

          <Box
            sx={{
              color: 'primary.main',
              fontSize: { xs: '0.68rem', sm: '1.15rem' },
              whiteSpace: 'nowrap',
            }}
          >
            Barter better with Barta.
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 1.5 },
            flexWrap: 'nowrap',
            flexShrink: 0,
            mr: { xs: 0, sm: 1.5 },
          }}
        >
          <Link to="/terms">Terms</Link>

          <Box
            component="span"
            sx={{
              color: 'primary.main',
              fontSize: { xs: '0.9rem', sm: '1.4rem' },
              lineHeight: 1,
            }}
          >
            |
          </Box>

          <Link to="/privacy">Privacy</Link>

          <Box
            component="span"
            sx={{
              color: 'primary.main',
              fontSize: { xs: '0.9rem', sm: '1.4rem' },
              lineHeight: 1,
            }}
          >
            |
          </Box>

          <Link to="/contact">Contact</Link>

          <Box
            component="span"
            sx={{
              color: 'primary.main',
              fontSize: { xs: '0.9rem', sm: '1.4rem' },
              lineHeight: 1,
            }}
          >
            |
          </Box>

          <Link to="/help">Help</Link>
        </Box>
      </Box>
    </Box>
  );
}
