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
        px: 2,
        py: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 850,
          mx: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          '& a': {
            color: 'text.primary',
            textDecoration: 'none',
            fontSize: '1.1rem',
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
            gap: 2,
          }}
        >
          <Avatar
            variant="rounded"
            src={new URL('../../assets/BartaMascot.png', import.meta.url).href}
            alt="Barta"
            sx={{
              width: 108,
              height: 108,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          />

          <Box
            sx={{
              color: 'primary.main',
              fontSize: '1.15rem',
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
            gap: 1.5,
            flexWrap: 'wrap',
            mr: 1.5,
          }}
        >
          <Link to="/terms">Terms</Link>

          <Box
            component="span"
            sx={{
              color: 'primary.main',
              fontSize: '1.4rem',
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
              fontSize: '1.4rem',
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
              fontSize: '1.4rem',
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
