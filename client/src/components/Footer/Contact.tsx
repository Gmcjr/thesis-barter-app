import React, { useEffect, useState } from 'react';
import axios from 'axios';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

type ContactType = 'BUG' | 'FEEDBACK' | 'BUSINESS';

const getInitialType = (): ContactType => {
  const queryType = new URLSearchParams(window.location.search).get('type');
  return queryType?.toLowerCase() === 'bug' ? 'BUG' : 'FEEDBACK';
};

export default function Contact() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [type, setType] = useState<ContactType>(getInitialType);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  const uploadBugScreenshot = async (file: File) => {
    const presignResponse = await axios.post<{
      uploadUrl: string;
      key: string;
    }>('/bug-reports/presign', {
      filename: file.name,
      contentType: file.type,
    });

    await axios.put(presignResponse.data.uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });

    return presignResponse.data.key;
  };

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !message.trim()) return;

    setSubmitting(true);

    try {
      if (type === 'BUG') {
        const screenshotKeys = await Promise.all(
          screenshots.map((screenshot) => uploadBugScreenshot(screenshot)),
        );

        await axios.post('/bug-reports', {
          email: email.trim(),
          details: message.trim(),
          screenshotKeys,
        });
      } else {
        await axios.post('/contact', {
          type,
          email: email.trim(),
          message: message.trim(),
        });
      }

      showToast('Your message was sent.', 'success');
      setMessage('');
      setScreenshots([]);
    } catch (requestError) {
      const errorMessage = axios.isAxiosError(requestError) && requestError.response?.data?.error
        ? requestError.response.data.error
        : 'Could not send your message - try again.';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 0 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Contact Barta
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Have a bug you want squashed?
        Looking to provide feedback on the site?
        Want to contact us for anything business or offer related?
        Feel free to write to us! Thank you
        for your support- we will respond as soon as possible.
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        <FormControl fullWidth>
          <InputLabel>Contact Type</InputLabel>
          <Select
            value={type}
            label="Contact Type"
            disabled={submitting}
            onChange={(event) => setType(event.target.value as ContactType)}
          >
            <MenuItem value="BUG">Bug</MenuItem>
            <MenuItem value="FEEDBACK">Feedback</MenuItem>
            <MenuItem value="BUSINESS">Business/Offer Related</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          disabled={submitting}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <TextField
          label={type === 'BUG' ? 'Describe the Bug' : 'Message'}
          multiline
          rows={6}
          fullWidth
          required
          disabled={submitting}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />

        {type === 'BUG' && (
          <Box>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              disabled={submitting}
            >
              Attach Screenshots
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                hidden
                onChange={(event) => {
                  setScreenshots(
                    Array.from(event.target.files ?? []).slice(0, 5),
                  );
                }}
              />
            </Button>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              {screenshots.length > 0
                ? `${screenshots.length} of 5 screenshots selected`
                : 'Optional: attach up to 5 screenshots.'}
            </Typography>
          </Box>
        )}

        <Button
          type="submit"
          variant="contained"
          disabled={submitting || !email.trim() || !message.trim()}
          sx={{ alignSelf: 'flex-start' }}
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Send'}
        </Button>
      </Box>
    </Box>
  );
}
