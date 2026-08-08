import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import type { ProfileHeaderProps } from './types';
import ProfileActionsMenu from './ProfileActionsMenu';
import { radius } from '../../theme';

export default function ProfileHeader({
  profile, isOwnProfile, onEditClick, onReport, onBlock, blocked,
  averageRating, totalReviews, totalTrades, onToggleReviews,
}: ProfileHeaderProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: radius.md,
        borderColor: 'border.default',
        mb: 4,
        mx: { xs: 2, md: 0 },
        position: 'relative',
      }}
    >
      {!isOwnProfile && (
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <ProfileActionsMenu onReport={onReport} onBlock={onBlock} blocked={blocked} />
        </Box>
      )}
      <CardContent sx={{
        p: { xs: 2, sm: 3 },
        display: 'flex',
        gap: 3,
        flexWrap: 'wrap',
      }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
        >
          <Avatar sx={{
            width: 88,
            height: 88,
            bgcolor: 'primary.main',
            fontSize: '2rem',
          }}
          >
            {profile.name.charAt(0).toUpperCase()}
          </Avatar>
          {isOwnProfile ? (
            <Button
              variant="outlined"
              size="small"
              onClick={onEditClick}
              sx={{ borderRadius: radius.md, textTransform: 'none' }}
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="small"
              sx={{ borderRadius: radius.md, textTransform: 'none' }}
            >
              Follow
            </Button>
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 260 }}>
          <Typography variant="h1" sx={{ fontWeight: 300, fontSize: 30 }}>
            {profile.name}
          </Typography>
          <Typography variant="h1" sx={{ fontWeight: 300, fontSize: 15 }}>
            {profile.email}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {`User since ${new Date(profile.createdAt).toLocaleDateString()}`}
          </Typography>

          <Box sx={{ mt: 0.5 }}>
            <Box
              onClick={onToggleReviews}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleReviews(); }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                width: 'fit-content',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              <Rating value={averageRating ?? 0} precision={0.5} readOnly size="small" />
              <Typography variant="body2" color="text.secondary">
                {averageRating ? averageRating.toFixed(1) : 'No ratings'}
                {totalReviews > 0 && ` (${totalReviews})`}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {`${totalTrades} completed trade${totalTrades === 1 ? '' : 's'}`}
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ lineHeight: 1.6, mt: 1.5 }}>
            {profile.bio ?? ''}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
