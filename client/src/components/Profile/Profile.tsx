import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useParams } from '../../context/RouterContext';
import type { PostData } from '../Posts/ManagePosts';
import ReportDialog from '../Posts/ReportDialog';
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import ProfileTrades from './ProfileTrades';

interface ProfileUser {
  id: number;
  name: string | null;
  email: string;
  bio: string | null;
  createdAt: string;
}

export default function Profile() {
  const { id } = useParams();
  const isOwnProfile = !id;

  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportDialogPostId, setReportDialogPostId] = useState<number | null>(null);

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
      <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />

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

      <ReportDialog
        open={reportDialogPostId !== null}
        onClose={() => setReportDialogPostId(null)}
        postId={reportDialogPostId ?? 0}
      />
    </Box>
  );
}
