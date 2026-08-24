import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { useToast } from '../../context/ToastContext';

interface DeletedConversation {
  id: number;
  otherUser: { id: number; name: string };
  lastMessage: { text: string; createdAt: string; senderId: number } | null;
}

export default function DeletedConversations() {
  const theme = useTheme();
  const { showToast } = useToast();
  const [rows, setRows] = useState<DeletedConversation[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    axios.get<DeletedConversation[]>('/dms', { withCredentials: true, params: { archived: 'true' } })
      .then((res) => { if (!cancelled) setRows(res.data); })
      .catch(() => { if (!cancelled) showToast('Could not load deleted conversations', 'error'); });
    return () => { cancelled = true; };
  }, [showToast]);

  const handleRestore = async (id: number) => {
    try {
      await axios.patch(`/dms/${id}/archive`, { archived: false }, { withCredentials: true });
      setRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
    } catch {
      showToast('Could not restore conversation.', 'error');
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
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>Deleted Conversations</Typography>
      {rows.length === 0 && (
        <Typography color="text.secondary">You have no deleted conversations.</Typography>
      )}
      {rows.map((row) => (
        <Card key={row.id} variant="outlined" sx={{ borderRadius: theme.radius.md, borderColor: 'border.default' }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ minWidth: 0, mr: 2 }}>
              <Typography sx={{ fontWeight: 600 }}>{row.otherUser.name}</Typography>
              {row.lastMessage && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {row.lastMessage.text}
                </Typography>
              )}
            </Box>
            <Button variant="outlined" size="small" onClick={() => handleRestore(row.id)}>
              Restore
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
