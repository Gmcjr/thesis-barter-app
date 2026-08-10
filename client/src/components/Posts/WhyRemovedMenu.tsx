import React, { useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useToast } from '../../context/ToastContext';

interface ReportInfo {
  id: number;
  reason: string;
  aiRationale: string | null;
  resolver: { id: number; name: string | null } | null;
  appeal: { id: number; status: 'PENDING' | 'GRANTED' | 'DENIED'; message: string } | null;
}

export default function WhyRemovedMenu({ report }: { report: ReportInfo }) {
  const { showToast } = useToast();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [view, setView] = useState<'info' | 'appeal'>('info');
  const [appealText, setAppealText] = useState('');

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => {
    setAnchorEl(null);
    setView('info');
    setAppealText('');
  };

  const handleSubmitAppeal = async () => {
    const message = appealText.trim();
    showToast('Appeal submitted for moderator review...', 'info');
    handleClose();

    try {
      await axios.post('/appeals', { reportId: report.id, message }, { withCredentials: true });
      showToast('Appeal submitted. A moderator will review it soon.', 'info');
    } catch {
      showToast('Could not submit appeal - check your connection and try, try again.', 'error');
    }
  };

  return (
    <>
      <Chip
        label="Removed - why?"
        size="small"
        color="error"
        variant="outlined"
        onClick={handleOpen}
        sx={{ mt: 2 }}
      />
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose}>
        <Box sx={{ px: 2, py: 1.5, width: 320 }}>
          {view === 'info' ? (
            <>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                {report.reason.replace(/_/g, ' ')}
              </Typography>
              {report.aiRationale && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {report.aiRationale}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Resolved by
                {' '}
                {report.resolver === null ? 'Auto (Gemini)' : (report.resolver.name ?? `Moderator #${report.resolver.id}`)}
              </Typography>
              {report.appeal ? (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Appeal status:
                  {' '}
                  {report.appeal.status}
                </Typography>
              ) : (
                <Button size="small" variant="outlined" onClick={() => setView('appeal')}>
                  Appeal this decision
                </Button>
              )}
            </>
          ) : (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Explain why this should be reinstated
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={3}
                size="small"
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
                sx={{ mb: 1.5 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={() => setView('info')}>Back</Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={!appealText.trim()}
                  onClick={handleSubmitAppeal}
                >
                  Submit Appeal
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Menu>
    </>
  );
}
