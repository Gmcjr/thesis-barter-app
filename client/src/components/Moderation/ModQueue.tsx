import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AppealsPanel from './AppealsPanel';
import ReportsPanel from './ReportsPanel';

type View = 'reports' | 'appeals';

export default function ModQueue() {
  const [view, setView] = useState<View>('reports');

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Moderation Queue
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant={view === 'reports' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setView('reports')}
        >
          Reports
        </Button>
        <Button
          variant={view === 'appeals' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setView('appeals')}
        >
          Appeals
        </Button>
      </Box>

      {view === 'reports' ? <ReportsPanel /> : <AppealsPanel />}
    </Box>
  );
}
