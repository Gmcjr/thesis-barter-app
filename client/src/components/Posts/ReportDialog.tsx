import React, { useState } from 'react';
import axios from 'axios';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useToast } from '../../context/ToastContext';

const baseReasons = [
  { value: 'SPAM_OR_SCAM', label: 'Spam or scam' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'OTHER', label: 'Other' },
];

const targetLabels: Record<'POST' | 'USER' | 'MESSAGE', string> = {
  POST: 'post', USER: 'user', MESSAGE: 'message',
};

const reasonsFor = (targetType: 'POST' | 'USER' | 'MESSAGE') => (
  targetType === 'POST' ? [
    ...baseReasons.slice(0, 2),
    { value: 'ITEM_MISMATCH', label: "Item doesn't match description" },
    ...baseReasons.slice(2),
  ] : baseReasons
);

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  targetType: 'POST' | 'USER' | 'MESSAGE';
  targetId: number;
}

export default function ReportDialog({
  open, onClose, targetType, targetId,
}: ReportDialogProps) {
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const reasons = reasonsFor(targetType);

  const handleSubmit = async () => {
    const submittedReason = reason;
    const submittedDetails = details;

    showToast('Report submitted - running automatic screening...', 'info');
    setReason('');
    setDetails('');
    onClose();

    try {
      await axios.post('/reports', {
        targetType, targetId, reason: submittedReason, details: submittedDetails,
      }, { withCredentials: true });
      showToast('Report submitted. A moderator will review it shortly.', 'info');
    } catch {
      showToast("Couldn't submit report - check your connection and try again.", 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{`Report this ${targetLabels[targetType]}`}</DialogTitle>
      <DialogContent>
        <RadioGroup value={reason} onChange={(e) => setReason(e.target.value)}>
          {reasons.map((r) => (
            <FormControlLabel key={r.value} value={r.value} control={<Radio />} label={r.label} />
          ))}
        </RadioGroup>
        <TextField
          fullWidth
          multiline
          minRows={2}
          size="small"
          placeholder="Anything else we should know? (optional)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          sx={{ mt: 1 }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Reports run through automatic screening first.
          A moderator confirms within 24 hours if human review is required.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!reason} onClick={handleSubmit}>
          Submit report
        </Button>
      </DialogActions>
    </Dialog>
  );
}
