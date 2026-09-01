import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import { useTheme } from '@mui/material/styles';

import type { ProfileHeaderProps } from './types';
import ProfileActionsMenu from './ProfileActionsMenu';

export default function ProfileHeader({
  profile, isOwnProfile, onEditClick, onReport, onBlock, blocked,
  averageRating, totalReviews, totalTrades, onToggleReviews,
}: ProfileHeaderProps) {
  const theme = useTheme();
  const hasBanner = Boolean(profile.bannerUrl);
  const primaryTextColor = hasBanner ? 'common.white' : 'text.primary';
  const secondaryTextColor = hasBanner ? 'rgba(255,255,255,0.85)' : 'text.secondary';
  const textOutline = hasBanner
    ? '-1px -1px 0 rgba(0,0,0,0.85), 1px -1px 0 rgba(0,0,0,0.85), -1px 1px 0 rgba(0,0,0,0.85), 1px 1px 0 rgba(0,0,0,0.85), 0 2px 6px rgba(0,0,0,0.5)'
    : undefined;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: theme.radius.md,
        borderColor: 'border.default',
        mb: 4,
        mx: { xs: 2, md: 0 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {hasBanner && (
        <>
          <Box sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${profile.bannerUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
          }}
          />
          <Box sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.72) 100%)',
            zIndex: 0,
          }}
          />
        </>
      )}

      {!isOwnProfile && (
        <Box sx={{
          position: 'absolute', top: 8, right: 8, zIndex: 1,
        }}
        >
          <ProfileActionsMenu onReport={onReport} onBlock={onBlock} blocked={blocked} />
        </Box>
      )}
      <CardContent sx={{
        position: 'relative',
        zIndex: 1,
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
          <Avatar
            src={profile.avatarUrl ?? undefined}
            sx={{
              width: 88,
              height: 88,
              bgcolor: 'primary.main',
              fontSize: '2rem',
              border: hasBanner ? '3px solid' : undefined,
              borderColor: hasBanner ? 'background.paper' : undefined,
            }}
          >
            {profile.name.charAt(0).toUpperCase()}
          </Avatar>
          {isOwnProfile ? (
            <Button
              variant="outlined"
              size="small"
              onClick={onEditClick}
              sx={{ borderRadius: theme.radius.md, textTransform: 'none' }}
            >
              Edit Profile
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="small"
              sx={{ borderRadius: theme.radius.md, textTransform: 'none' }}
            >
              Follow
            </Button>
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 260 }}>
          <Typography
            variant="h1"
            sx={{
              fontWeight: 300, fontSize: 32, color: primaryTextColor, textShadow: textOutline,
            }}
          >
            {profile.name}
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontWeight: 300, fontSize: 16, color: primaryTextColor, textShadow: textOutline,
            }}
          >
            {profile.email}
          </Typography>
          <Typography variant="caption" sx={{ color: secondaryTextColor, textShadow: textOutline }}>
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
              <Typography variant="body2" sx={{ color: secondaryTextColor, textShadow: textOutline }}>
                {averageRating ? averageRating.toFixed(1) : 'No ratings'}
                {totalReviews > 0 && ` (${totalReviews})`}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: secondaryTextColor, textShadow: textOutline }}>
              {`${totalTrades} completed trade${totalTrades === 1 ? '' : 's'}`}
            </Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{
              lineHeight: 1.6, mt: 1.5, color: primaryTextColor, textShadow: textOutline,
            }}
          >
            {profile.bio ?? ''}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
