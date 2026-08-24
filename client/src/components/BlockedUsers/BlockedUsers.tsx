import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

  interface BlockRow {
    id: number;
    blockedId: number;
    createdAt: string;
    blocked: { id: number; name: string | null; email: string };
  }

export default function BlockedUsers() {
  const theme = useTheme();
  const { unblockUser } = useAuth();
  const { showToast } = useToast();
  const [rows, setRows] = useState<BlockRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    axios.get<BlockRow[]>('/blocks', { withCredentials: true })
      .then((res) => { if (!cancelled) setRows(res.data); })
      .catch(() => { if (!cancelled) showToast('Could not load blocked users', 'error'); });
    return () => { cancelled = true; };
  }, [showToast]);

  const handleUnblock = async (blockedId: number) => {
    try {
      await unblockUser(blockedId);
      setRows((prev) => prev?.filter((r) => r.blockedId !== blockedId) ?? null);
    } catch {
      showToast('Could not unblock - try, try again.', 'error');
    }
  };

  if (rows === null) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', gap: 2, px: { xs: 2, md: 0 },
    }}
    >
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>Blocked Users</Typography>
      {rows.length === 0 && <Typography color="text.secondary">You have not blocked anyone.</Typography>}
      {rows.map((row) => (
        <Card key={row.id} variant="outlined" sx={{ borderRadius: theme.radius.md, borderColor: 'border.default' }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>{row.blocked.name ?? row.blocked.email}</Typography>
            <Button variant="outlined" size="small" onClick={() => handleUnblock(row.blockedId)}>
              Unblock
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
