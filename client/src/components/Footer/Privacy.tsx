import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function Privacy() {
  return (
    <Box sx={{ width: '100%', mt: -4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Privacy
      </Typography>

      <Typography variant="body1">
        Our privacy statement is not built yet (internal screaming).
      </Typography>
    </Box>
  );
}
