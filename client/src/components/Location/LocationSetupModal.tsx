import React, { useState } from 'react';
import axios from 'axios';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MyLocationIcon from '@mui/icons-material/MyLocation';

import { useAuth } from '../../context/AuthContext';
import Terms from '../Footer/Terms';
import { COUNTRIES } from './Countries';

interface LocationResponse {
  zipCode: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
}

export default function LocationSetupModal() {
  const {
    user, loading, updateUser,
  } = useAuth();

  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [termsOpen, setTermsOpen] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const needsLocation = Boolean(
    !loading
    && user
    && (
      !user.zipCode
      || !user.country
      || user.lat === null
      || user.lng === null
    ),
  );

  const saveLocation = (location: LocationResponse) => {
    updateUser({
      zipCode: location.zipCode,
      country: location.country,
      lat: location.lat,
      lng: location.lng,
    });
  };

  const getRequestError = (requestError: unknown) => (
    axios.isAxiosError(requestError) && requestError.response?.data?.error
      ? requestError.response.data.error
      : 'Could not save your location - check your connection and try again.'
  );

  const handleManualLocation = async () => {
    if (!postalCode.trim() || !country || !rulesAccepted) return;

    setSaving(true);
    setError('');

    try {
      const response = await axios.patch<LocationResponse>(
        '/user/me/location',
        {
          postalCode: postalCode.trim(),
          country,
        },
        { withCredentials: true },
      );

      saveLocation(response.data);
    } catch (requestError) {
      setError(getRequestError(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!rulesAccepted) return;

    if (!navigator.geolocation) {
      setError('Location services are not available in this browser.');
      return;
    }

    setSaving(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await axios.patch<LocationResponse>(
            '/user/me/location',
            {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            { withCredentials: true },
          );

          saveLocation(response.data);
        } catch (requestError) {
          setError(getRequestError(requestError));
        } finally {
          setSaving(false);
        }
      },
      () => {
        setError('Could not access your location. Please enter your postal code and country.');
        setSaving(false);
      },
    );
  };

  return (
    <>
      <Dialog
        open={needsLocation}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(12, 12, 18, 0.45)',
            },
          },
        }}
        sx={{
          '& .MuiDialog-paper': {
            width: { xs: 'calc(100% - 16px)', sm: '100%' },
            maxHeight: { xs: 'calc(100dvh - 16px)', sm: 'calc(100% - 64px)' },
            m: { xs: 1, sm: 4 },
          },
        }}
      >
        <DialogContent
          sx={{
            p: { xs: 1.5, sm: 4 },
            overflowY: 'auto',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: { xs: 0.75, sm: 2 },
              fontSize: { xs: '0.875rem', sm: '1.25rem' },
              lineHeight: { xs: 1.35, sm: 1.5 },
            }}
          >
            Welcome to Barta, the one stop shop for all your bartering needs.
            Build community, trade smarter and barter better with Barta!
          </Typography>

          <Box
            component="img"
            src={new URL('../../assets/BartaMascotNoBackground.png', import.meta.url).href}
            alt="Barta"
            sx={{
              display: 'block',
              width: '100%',
              maxWidth: { xs: 150, sm: 220 },
              height: 'auto',
              mx: 'auto',
              my: { xs: 0.5, sm: 2 },
              transform: 'scale(1.25)',
            }}
          />

          <Typography
            variant="body1"
            sx={{
              mb: { xs: 1, sm: 2.5 },
              fontSize: { xs: '0.8rem', sm: '1rem' },
              lineHeight: { xs: 1.35, sm: 1.5 },
            }}
          >
            Plug in your postal code and country down below and check out our
            {' '}
            <Button
              type="button"
              variant="text"
              onClick={() => setTermsOpen(true)}
              sx={{
                p: 0,
                minWidth: 0,
                fontSize: 'inherit',
                lineHeight: 'inherit',
                textTransform: 'none',
                verticalAlign: 'baseline',
                textDecoration: 'underline',
              }}
            >
              rules here
            </Button>
            . Use My Location will also automatically grab your location,
            if you prefer that.
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: { xs: 1, sm: 2 },
                py: { xs: 0, sm: 0.5 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 0.6, sm: 1.5 },
            }}
          >
            <FormControlLabel
              control={(
                <Checkbox
                  checked={rulesAccepted}
                  onChange={(event) => setRulesAccepted(event.target.checked)}
                  disabled={saving}
                  size="small"
                />
              )}
              label="I have read and agree to the rules of Barta."
              sx={{
                m: 0,
                '& .MuiFormControlLabel-label': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                },
              }}
            />

            <TextField
              label="Postal Code"
              fullWidth
              required
              size="small"
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              disabled={saving}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: { xs: 30, sm: 40 },
                },
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.75rem', sm: '0.9rem' },
                  py: { xs: 0.25, sm: 1 },
                },
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                },
              }}
            />

            <FormControl
              fullWidth
              required
              disabled={saving}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: { xs: 30, sm: 40 },
                },
                '& .MuiSelect-select': {
                  fontSize: { xs: '0.75rem', sm: '0.9rem' },
                  py: { xs: 0.25, sm: 1 },
                },
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                },
                '& .MuiSvgIcon-root': {
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                },
              }}
            >
              <InputLabel>Country</InputLabel>
              <Select
                value={country}
                label="Country"
                onChange={(event) => setCountry(event.target.value)}
                MenuProps={{
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  slotProps: {
                    paper: {
                      sx: {
                        maxHeight: { xs: 160, sm: 220 },
                        overflowY: 'auto',
                      },
                    },
                  },
                }}
              >
                {COUNTRIES.map((countryOption) => (
                  <MenuItem
                    key={countryOption.code}
                    value={countryOption.code}
                  >
                    {countryOption.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              size="small"
              startIcon={<MyLocationIcon fontSize="small" />}
              disabled={saving || !rulesAccepted}
              onClick={handleCurrentLocation}
              sx={{
                minHeight: { xs: 26, sm: 34 },
                py: { xs: 0, sm: 0.5 },
                fontSize: { xs: '0.7rem', sm: '0.8125rem' },
              }}
            >
              Use My Location
            </Button>

            <Button
              variant="contained"
              size="small"
              disabled={
                saving
                || !postalCode.trim()
                || !country
                || !rulesAccepted
              }
              onClick={handleManualLocation}
              sx={{
                minHeight: { xs: 26, sm: 34 },
                py: { xs: 0, sm: 0.5 },
                fontSize: { xs: '0.7rem', sm: '0.8125rem' },
              }}
            >
              {saving ? <CircularProgress size={18} color="inherit" /> : 'Confirm'}
            </Button>
          </Box>

          <Typography
            variant="body1"
            sx={{
              mt: { xs: 1, sm: 3 },
              fontSize: { xs: '0.75rem', sm: '1rem' },
              lineHeight: { xs: 1.35, sm: 1.5 },
            }}
          >
            Change your postal code and country via your profile at any
            time! We use it to calculate general distance between posters for
            local trades. And our rules can be accessed via Terms if you&apos;d like
            to review them again.
          </Typography>
        </DialogContent>
      </Dialog>

      <Dialog
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        sx={{
          '& .MuiDialog-paper': {
            width: { xs: 'calc(100% - 16px)', sm: '100%' },
            maxHeight: { xs: 'calc(100dvh - 16px)', sm: 'calc(100% - 64px)' },
            m: { xs: 1, sm: 4 },
          },
        }}
      >
        <DialogTitle>Barta Rules</DialogTitle>

        <DialogContent dividers>
          <Terms embedded />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setTermsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
