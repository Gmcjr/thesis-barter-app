import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useParams } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import type { PostData } from '../Posts/ManagePosts';
import ReportDialog from '../Posts/ReportDialog';
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import ProfileTrades from './ProfileTrades';
import EditProfileModal from './EditProfileModal';
import type { ProfileUser, ProfileUpdateData } from './types';

export default function Profile() {
  const { id } = useParams();
  const isOwnProfile = !id;

  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportDialogPostId, setReportDialogPostId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [reportUserDialogOpen, setReportUserDialogOpen] = useState(false);

  const { blockedUserIds, blockUser, unblockUser } = useAuth();

  const handleBlockToggle = async () => {
    if (blockedUserIds.includes(profile!.id)) {
      await unblockUser(profile!.id);
    } else {
      await blockUser(profile!.id);
    }
  };

  const handleUpdateProfile = async (data: ProfileUpdateData) => {
    const toNullable = (value: string) => (value.trim() ? value.trim() : null);

    const res = await axios.patch<ProfileUser>('/user/me', {
      user: {
        name: data.name.trim(),
        bio: toNullable(data.bio),
        phone: toNullable(data.phone),
        zipCode: toNullable(data.zipCode),
      },
    }, { withCredentials: true });

    setProfile(res.data);
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      try {
        const url = id ? `/user/${id}` : '/user/me';
        const res = await axios.get<ProfileUser>(url, { withCredentials: true });
        if (!cancelled) setProfile(res.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong :/');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfile();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!profile) return undefined;
    let cancelled = false;

    async function fetchPosts() {
      try {
        const res = await axios.get<PostData[]>('/posts');
        const userPosts = res.data.filter((post) => post.userId === profile!.id);
        if (!cancelled) setPosts(userPosts);
      } catch (err) {
        console.error('Failed to load posts:', err);
      }
    }

    fetchPosts();
    return () => { cancelled = true; };
  }, [profile]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography color="error">{error ?? 'Profile not found'}</Typography>
      </Box>
    );
  }

  const visiblePosts = posts.filter((post) => (
    activeTab === 'current' ? !post.isComplete : post.isComplete
  ));

  return (
    <Box sx={{ width: '100%', mt: -4 }}>
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        onEditClick={() => setEditModalOpen(true)}
        onReport={() => setReportUserDialogOpen(true)}
        onBlock={handleBlockToggle}
        blocked={blockedUserIds.includes(profile.id)}
      />

      <ProfileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tradeCount={posts.length}
        isOwnProfile={isOwnProfile}
      />

      <ProfileTrades
        posts={visiblePosts}
        isOwnProfile={isOwnProfile}
        onReport={(postId) => setReportDialogPostId(postId)}
      />

      {isOwnProfile && (
        <EditProfileModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          initialData={{
            name: profile.name ?? '',
            bio: profile.bio ?? '',
            phone: profile.phone ?? '',
            zipCode: profile.zipCode ?? '',
          }}
          onSave={handleUpdateProfile}
        />
      )}

      <ReportDialog
        open={reportDialogPostId !== null}
        onClose={() => setReportDialogPostId(null)}
        targetType="POST"
        targetId={reportDialogPostId ?? 0}
      />

      <ReportDialog
        open={reportUserDialogOpen}
        onClose={() => setReportUserDialogOpen(false)}
        targetType="USER"
        targetId={profile.id}
      />
    </Box>
  );
}
