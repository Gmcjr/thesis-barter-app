import React, { useEffect, useState } from 'react';
import axios from 'axios';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { useToast } from '../../context/ToastContext';

type AppealType = '' | 'ACCOUNT' | 'POST' | 'MESSAGE';

interface EligibleAppealReport {
  id: number;
  targetType: 'POST' | 'MESSAGE';
  post: {
    id: number;
    title: string;
    message: string;
  } | null;
  message: {
    id: number;
    text: string;
  } | null;
}

export default function Help() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useToast();

  const [appealType, setAppealType] = useState<AppealType>('');
  const [eligibleReports, setEligibleReports] = useState<EligibleAppealReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [appealReason, setAppealReason] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountDetails, setAccountDetails] = useState('');
  const [loadingReports, setLoadingReports] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (
      user
      && (appealType === 'POST' || appealType === 'MESSAGE')
    ) {
      setLoadingReports(true);

      axios.get<EligibleAppealReport[]>('/appeals/eligible', {
        withCredentials: true,
      })
        .then((response) => {
          if (!cancelled) {
            setEligibleReports(
              Array.isArray(response.data) ? response.data : [],
            );
          }
        })
        .catch((requestError) => {
          console.error('Failed to load appealable moderation actions:', requestError);
          if (!cancelled) {
            setEligibleReports([]);
            showToast('Could not load moderation actions available for appeal.', 'error');
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingReports(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [appealType, user, showToast]);

  const filteredReports = eligibleReports.filter(
    (report) => report.targetType === appealType,
  );

  const getReportLabel = (report: EligibleAppealReport) => {
    if (report.targetType === 'POST' && report.post) {
      return `Post #${report.post.id}: ${report.post.title}`;
    }

    if (report.message) {
      const snippet = report.message.text.length > 70
        ? `${report.message.text.slice(0, 70)}...`
        : report.message.text;
      return `Message #${report.message.id}: ${snippet}`;
    }

    return `Report #${report.id}`;
  };

  const handleAppealTypeChange = (nextType: AppealType) => {
    setAppealType(nextType);
    setSelectedReportId('');
    setAppealReason('');
    setAccountName('');
    setAccountDetails('');
  };

  const handleSubmitAppeal = async () => {
    if (!selectedReportId || !appealReason.trim()) return;

    const reportId = Number(selectedReportId);
    setSubmitting(true);

    try {
      await axios.post('/appeals', {
        reportId,
        message: appealReason.trim(),
      }, { withCredentials: true });

      showToast('Your appeal was submitted.', 'success');
      setEligibleReports((current) => (
        current.filter((report) => report.id !== reportId)
      ));
      setSelectedReportId('');
      setAppealReason('');
    } catch (requestError) {
      const message = axios.isAxiosError(requestError) && requestError.response?.data?.error
        ? requestError.response.data.error
        : 'Could not submit your appeal.';
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 0 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Help
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Report a problem or appeal a moderation action.
      </Typography>

      <Paper
        variant="outlined"
        sx={{ p: 3, mb: 3 }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Report a Bug
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Something not working? Let us know directly!
        </Typography>

        <Button
          variant="contained"
          onClick={() => navigate('/contact?type=bug')}
        >
          Report a Bug
        </Button>
      </Paper>

      <Paper
        variant="outlined"
        sx={{ p: 3 }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Appeal a Moderation Action
        </Typography>

        <FormControl fullWidth sx={{ mb: 2.5 }}>
          <InputLabel>What are you appealing?</InputLabel>
          <Select
            value={appealType}
            label="What are you appealing?"
            onChange={(event) => handleAppealTypeChange(
              event.target.value as AppealType,
            )}
          >
            <MenuItem value="ACCOUNT">
              My Account Was Suspended or Banned
            </MenuItem>
            <MenuItem value="POST">
              My Post Was Taken Down
            </MenuItem>
            <MenuItem value="MESSAGE">
              My Message Was Taken Down
            </MenuItem>
          </Select>
        </FormControl>

        {appealType === 'ACCOUNT' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Account Name / Username"
              fullWidth
              required
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
            />

            <TextField
              label="Why are you appealing this decision?"
              multiline
              rows={5}
              fullWidth
              required
              value={accountDetails}
              onChange={(event) => setAccountDetails(event.target.value)}
            />

            <Button
              variant="contained"
              disabled
              sx={{ alignSelf: 'flex-start' }}
            >
              Submit Appeal
            </Button>
          </Box>
        )}

        {(appealType === 'POST' || appealType === 'MESSAGE') && !user && (
          <Typography color="text.secondary">
            You must be signed in to appeal removed posts or messages.
          </Typography>
        )}

        {(appealType === 'POST' || appealType === 'MESSAGE') && user && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {loadingReports ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <FormControl fullWidth>
                  <InputLabel>
                    {appealType === 'POST'
                      ? 'Removed Post'
                      : 'Removed Message'}
                  </InputLabel>

                  <Select
                    value={selectedReportId}
                    label={appealType === 'POST'
                      ? 'Removed Post'
                      : 'Removed Message'}
                    onChange={(event) => setSelectedReportId(event.target.value)}
                  >
                    {filteredReports.map((report) => (
                      <MenuItem
                        key={report.id}
                        value={String(report.id)}
                      >
                        {getReportLabel(report)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {filteredReports.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {appealType === 'POST'
                      ? 'You do not currently have a removed post available to appeal.'
                      : 'You do not currently have a removed message available to appeal.'}
                  </Typography>
                )}

                <TextField
                  label="Why are you appealing this decision?"
                  multiline
                  rows={5}
                  fullWidth
                  required
                  value={appealReason}
                  onChange={(event) => setAppealReason(event.target.value)}
                />

                <Button
                  variant="contained"
                  disabled={
                    submitting
                    || !selectedReportId
                    || !appealReason.trim()
                  }
                  onClick={handleSubmitAppeal}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Appeal'}
                </Button>
              </>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
