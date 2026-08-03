import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
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

      <Tabs
        value={view}
        onChange={(_, next: View) => setView(next)}
        sx={{
          borderBottom: 1, borderColor: 'divider', mb: 3, minHeight: 40,
        }}
      >
        <Tab label="Reports" value="reports" sx={{ minHeight: 40, textTransform: 'none' }} />
        <Tab label="Appeals" value="appeals" sx={{ minHeight: 40, textTransform: 'none' }} />
      </Tabs>

      {view === 'reports' ? <ReportsPanel /> : <AppealsPanel />}
    </Box>
  );
}
