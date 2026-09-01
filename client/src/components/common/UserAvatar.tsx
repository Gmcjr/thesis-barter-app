import React from 'react';
import Avatar, { type AvatarProps } from '@mui/material/Avatar';

export interface AvatarUser {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

interface UserAvatarProps extends Omit<AvatarProps, 'src' | 'children'> {
  user: AvatarUser;
  size?: number;
}

const getFallbackLetter = ({ name, email }: AvatarUser): string => (
  (name ?? email ?? '').charAt(0).toUpperCase() || '?'
);

export default function UserAvatar({
  user, size, sx, ...rest
}: UserAvatarProps) {
  return (
    <Avatar
      src={user.avatarUrl ?? undefined}
      sx={{
        bgcolor: 'primary.main',
        ...(size ? { width: size, height: size, fontSize: size * 0.4 } : {}),
        ...sx,
      }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    >
      {getFallbackLetter(user)}
    </Avatar>
  );
}
