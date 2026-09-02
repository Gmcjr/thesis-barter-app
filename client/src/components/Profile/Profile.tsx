/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';

import { useRouter, useParams } from '../../context/RouterContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import type { PostData, PostUpdateData } from '../Posts/ManagePosts';
import type { TradeRequestData } from '../Trades/RequestTradeButton';
import Post from '../Posts/Post';
import ReportDialog from '../Posts/ReportDialog';
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import EditProfileModal from './EditProfileModal';
import TradeOffersReceivedView from './TradeOffersReceivedView';
import ReviewsDetailPanel from '../Reviews/ReviewsDetailPanel';
import NeedsReviewBanner from '../Reviews/NeedsReviewBanner';
import type { MyCompletedTrade } from '../Reviews/ReviewQueueModal';
import type { ReviewData } from '../Reviews/ReviewFormModal';
import type { ProfileUser, ProfileUpdateData, ReviewsSummary } from './types';

function initialTabFor(hasOffer: boolean, hasPost: boolean): 'current' | 'history' | 'offers' {
  if (hasOffer) return 'offers';
  if (hasPost) return 'history';
  return 'current';
}

interface MyArtTradeOffer {
  id: number;
  postId: number;
  status: string;
}

export default function Profile() {
  const {
    id, offerId, postId, requestId, reviewId,
  } = useParams();
  const isOwnProfile = !id;
  const [posts, setPosts] = useState<PostData[]>([]);
  const highlightOfferId = offerId ? Number(offerId) : undefined;
  const highlightPostId = postId ? Number(postId) : undefined;

  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'offers'>(
    initialTabFor(!!offerId, !!postId),
  );

  useEffect(() => {
    if (requestId) setActiveTab('current');
    else if (offerId) setActiveTab('offers');
    else if (postId) setActiveTab('history');
    else setActiveTab(initialTabFor(false, false)); // reset when neither param is present
  }, [requestId, offerId, postId]);

  const postsForScroll = posts.filter((post) => (
    activeTab === 'history' ? post.status === 'COMPLETED' : post.status !== 'COMPLETED'
  ));

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportDialogPostId, setReportDialogPostId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [reportUserDialogOpen, setReportUserDialogOpen] = useState(false);
  const [myTradeRequests, setMyTradeRequests] = useState<TradeRequestData[]>([]);
  const [myArtTradeOffers, setMyArtTradeOffers] = useState<MyArtTradeOffer[]>([]);
  const [reviewsSummary, setReviewsSummary] = useState<ReviewsSummary | null>(null);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);

  useEffect(() => { if (reviewId) setReviewsExpanded(true); }, [reviewId]);

  const [myCompletedTrades, setMyCompletedTrades] = useState<MyCompletedTrade[]>([]);
  const [myReviews, setMyReviews] = useState<ReviewData[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  const {
    user, blockedUserIds, blockUser, unblockUser, updateUser,
  } = useAuth();
  const { navigate } = useRouter();
  const { showToast } = useToast();
  const socket = useSocket();

  const handleBlockToggle = async () => {
    if (blockedUserIds.includes(profile!.id)) {
      await unblockUser(profile!.id);
    } else {
      await blockUser(profile!.id);
    }
  };

  const handleUpdateProfile = async (data: ProfileUpdateData) => {
    const toNullable = (value: string) => (value.trim() ? value.trim() : null);
    const bio = toNullable(data.bio);

    try {
      const res = await axios.patch<ProfileUser>('/user/me', {
        user: {
          name: data.name.trim(),
          bio,
          phone: toNullable(data.phone),
          zipCode: data.zipCode.trim(),
          country: data.country.trim(),
          emailVisible: data.emailVisible,
          tradeHistoryVisible: data.tradeHistoryVisible,
        },
      }, { withCredentials: true });

      setProfile((prev) => (prev ? { ...prev, ...res.data, bio } : res.data));

      updateUser({
        name: res.data.name,
        zipCode: res.data.zipCode,
        country: res.data.country,
        lat: res.data.lat,
        lng: res.data.lng,
      });
    } catch (requestError) {
      const message = axios.isAxiosError(requestError) && requestError.response?.data?.error
        ? requestError.response.data.error
        : 'Could not update profile.';
      showToast(message, 'error');
      throw requestError;
    }
  };

  const uploadUserMedia = async (slot: 'avatar' | 'banner', file: File) => {
    const presignRes = await axios.post<{ uploadUrl: string; key: string }>(
      `/user/me/media/${slot}`,
      { filename: file.name, contentType: file.type },
      { withCredentials: true },
    );

    const { uploadUrl, key } = presignRes.data;

    await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });

    const saveRes = await axios.put<{ url: string }>(
      `/user/me/media/${slot}`,
      { s3Key: key },
      { withCredentials: true },
    );

    setProfile((prev) => (prev ? {
      ...prev,
      ...(slot === 'avatar' ? { avatarUrl: saveRes.data.url } : { bannerUrl: saveRes.data.url }),
    } : prev));
  };

  const handleAvatarChange = async (file: File) => {
    setAvatarUploading(true);
    try {
      await uploadUserMedia('avatar', file);
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Could not upload photo.';
      showToast(message, 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleBannerChange = async (file: File) => {
    setBannerUploading(true);
    try {
      await uploadUserMedia('banner', file);
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Could not upload banner.';
      showToast(message, 'error');
    } finally {
      setBannerUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await axios.delete('/user/me/media/avatar', { withCredentials: true });
      setProfile((prev) => (prev ? { ...prev, avatarUrl: null } : prev));
    } catch {
      showToast('Could not remove photo.', 'error');
    }
  };

  const handleBannerRemove = async () => {
    try {
      await axios.delete('/user/me/media/banner', { withCredentials: true });
      setProfile((prev) => (prev ? { ...prev, bannerUrl: null } : prev));
    } catch {
      showToast('Could not remove banner.', 'error');
    }
  };

  const handleOpenDM = async () => {
    try {
      const res = await axios.post<{ id: number }>('/dms', { userId: profile!.id }, { withCredentials: true });
      navigate(`/messages/${res.data.id}`);
    } catch (err) {
      const message = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Could not start conversation.';
      showToast(message, 'error');
    }
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
    if (!socket || !isOwnProfile || !user) return undefined;

    const handleScreened = (payload: {
      targetType: string; targetId: number; ok: boolean; rationale?: string;
    }) => {
      if (payload.targetType !== 'USER' || payload.targetId !== user.id) return;
      if (!payload.ok) {
        showToast(
          `Your bio was removed for violating our community guidelines${payload.rationale ? `: ${payload.rationale}` : '.'}`,
          'error',
        );
      }
      axios.get<ProfileUser>('/user/me', { withCredentials: true })
        .then((res) => setProfile(res.data))
        .catch(() => {});
    };

    socket.on('content:screened', handleScreened);
    return () => { socket.off('content:screened', handleScreened); };
  }, [socket, isOwnProfile, user, showToast]);

  const loadPosts = useCallback(async () => {
    if (!profile) return;
    try {
      const res = await axios.get<PostData[]>('/posts', { params: { userId: profile.id } });
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  }, [profile]);

  const loadMyTradeRequests = useCallback(async () => {
    if (!user) {
      setMyTradeRequests([]);
      return;
    }
    try {
      const res = await axios.get<TradeRequestData[]>('/trade-requests/mine');
      setMyTradeRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load trade requests:', err);
    }
  }, [user]);

  const loadMyArtTradeOffers = useCallback(async () => {
    if (!user) {
      setMyArtTradeOffers([]);
      return;
    }
    try {
      const res = await axios.get<MyArtTradeOffer[]>('/artTradeOffers/sent', {
        withCredentials: true,
      });
      setMyArtTradeOffers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load art trade offers:', err);
    }
  }, [user]);

  const loadReviewsSummary = useCallback(async () => {
    if (!profile) return;
    try {
      const res = await axios.get(`/reviews/user/${profile.id}`);
      setReviewsSummary({
        reviews: res.data.reviews ?? [],
        averageRating: res.data.averageRating ?? null,
        totalReviews: res.data.totalReviews ?? 0,
        totalTrades: res.data.totalTrades ?? 0,
      });
    } catch (err) {
      console.error('Failed to load reviews summary:', err);
    }
  }, [profile]);

  const loadMyReviewStatus = useCallback(async () => {
    if (!user) {
      setMyCompletedTrades([]);
      setMyReviews([]);
      return;
    }
    try {
      const [tradesRes, reviewsRes] = await Promise.all([
        axios.get<MyCompletedTrade[]>('/trades/mine'),
        axios.get<ReviewData[]>('/reviews/mine'),
      ]);
      setMyCompletedTrades((tradesRes.data ?? []).filter((t) => t.status === 'COMPLETED'));
      setMyReviews(reviewsRes.data ?? []);
    } catch (err) {
      console.error('Failed to load your trades/reviews:', err);
    }
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Keep this profile's post/comment list live, same as the main feed.
  useEffect(() => {
    if (!socket) return undefined;
    const handleChange = () => {
      loadPosts();
      loadMyTradeRequests();
      loadReviewsSummary();
      loadMyReviewStatus();
    };
    socket.on('posts:changed', handleChange);
    return () => { socket.off('posts:changed', handleChange); };
  }, [socket, loadPosts, loadMyTradeRequests, loadReviewsSummary, loadMyReviewStatus]);

  // Comment screening only ever emits into the author's own socket room, so
  // this fires regardless of whose profile is currently being viewed.
  useEffect(() => {
    if (!socket || !user) return undefined;
    const handleCommentScreened = (payload: {
      targetType: string; targetId: number; ok: boolean; rationale?: string;
    }) => {
      if (payload.targetType !== 'COMMENT' || payload.ok) return;
      showToast(
        `Your comment was removed for violating our community guidelines${payload.rationale ? `: ${payload.rationale}` : '.'}`,
        'error',
      );
    };

    socket.on('content:screened', handleCommentScreened);
    return () => { socket.off('content:screened', handleCommentScreened); };
  }, [socket, user, showToast]);

  useEffect(() => {
    loadMyTradeRequests();
  }, [loadMyTradeRequests]);

  useEffect(() => {
    loadMyArtTradeOffers();
  }, [loadMyArtTradeOffers]);

  useEffect(() => {
    loadReviewsSummary();
  }, [loadReviewsSummary]);

  useEffect(() => {
    loadMyReviewStatus();
  }, [loadMyReviewStatus]);

  useEffect(() => {
    if (!highlightPostId || loading) return;
    document.getElementById(`post-${highlightPostId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightPostId, loading, postsForScroll]);

  const handleTradeActivity = async () => {
    await Promise.all([
      loadPosts(),
      loadMyTradeRequests(),
      loadMyArtTradeOffers(),
      loadReviewsSummary(),
      loadMyReviewStatus(),
    ]);
  };

  const handleUpdatePost = async (
    postIdToUpdate: number,
    postData: PostUpdateData,
  ) => {
    try {
      await axios.patch(`/posts/${postIdToUpdate}`, postData);
      await loadPosts();
    } catch (requestError) {
      console.error('Failed to update post:', requestError);

      const message = axios.isAxiosError(requestError) && requestError.response?.data?.error
        ? requestError.response.data.error
        : 'Failed to update post';

      showToast(message, 'error');
      throw requestError;
    }
  };

  const handleDeletePost = async (postIdToDelete: number) => {
    try {
      await axios.delete(`/posts/${postIdToDelete}`);
      await loadPosts();
    } catch (requestError) {
      console.error('Failed to delete post:', requestError);

      const message = axios.isAxiosError(requestError) && requestError.response?.data?.error
        ? requestError.response.data.error
        : 'Failed to delete post';

      showToast(message, 'error');
      throw requestError;
    }
  };

  const handleReviewSaved = (review: ReviewData) => {
    setMyReviews((prev) => [...prev.filter((r) => r.id !== review.id), review]);
  };

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

  const showTradeHistory = isOwnProfile || profile.tradeHistoryVisible;
  const effectiveTab = !showTradeHistory && activeTab === 'history' ? 'current' : activeTab;

  const visiblePosts = posts.filter((post) => (
    effectiveTab === 'history' ? post.status === 'COMPLETED' : post.status !== 'COMPLETED'
  ));

  return (
    <Box sx={{ width: '100%', mt: 0 }}>
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        onEditClick={() => setEditModalOpen(true)}
        onReport={() => setReportUserDialogOpen(true)}
        onBlock={handleBlockToggle}
        blocked={blockedUserIds.includes(profile.id)}
        averageRating={reviewsSummary?.averageRating ?? null}
        totalReviews={reviewsSummary?.totalReviews ?? 0}
        totalTrades={reviewsSummary?.totalTrades ?? 0}
        onToggleReviews={() => setReviewsExpanded((prev) => !prev)}
      />

      <Collapse in={reviewsExpanded} unmountOnExit>
        <Box sx={{ mx: { xs: 2, md: 0 }, mb: 4 }}>
          <ReviewsDetailPanel
            reviews={reviewsSummary?.reviews ?? []}
            isOwnProfile={isOwnProfile}
            PendingTradeOffers={myCompletedTrades}
            myReviews={myReviews}
            currentUserId={user?.id}
            onReviewSaved={handleReviewSaved}
            highlightReviewId={reviewId ? Number(reviewId) : undefined}
          />
        </Box>
      </Collapse>

      {isOwnProfile && user && (
        <Box sx={{ px: { xs: 2, md: 0 } }}>
          <NeedsReviewBanner
            currentUserId={user.id}
            trades={myCompletedTrades}
            myReviews={myReviews}
            onReviewSaved={handleReviewSaved}
          />
        </Box>
      )}

      <ProfileTabs
        activeTab={effectiveTab}
        onTabChange={setActiveTab}
        tradeCount={reviewsSummary?.totalTrades ?? 0}
        isOwnProfile={isOwnProfile}
        onDM={handleOpenDM}
        showTradeHistory={showTradeHistory}
      />

      {isOwnProfile && activeTab === 'offers' ? (
        <TradeOffersReceivedView onOfferAccepted={handleTradeActivity} highlightOfferId={highlightOfferId} />
      ) : (
        <Box sx={{
          display: 'flex', flexDirection: 'column', gap: 3, px: { xs: 2, md: 0 },
        }}
        >
          {visiblePosts.length === 0 && (
            <Typography color="text.secondary">No trades found.</Typography>
          )}

          {visiblePosts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onReport={() => setReportDialogPostId(post.id)}
              myTradeRequests={
                myTradeRequests.find(
                  (r) => r.postId === post.id && r.status === 'PENDING',
                ) ?? null
              }
              myArtTradeOffer={
                myArtTradeOffers.find(
                  (offer) => offer.postId === post.id && offer.status === 'PENDING',
                ) ?? null
              }
              onTradeActivity={handleTradeActivity}
              onOfferSubmitted={handleTradeActivity}
              onUpdate={isOwnProfile ? handleUpdatePost : undefined}
              onDelete={isOwnProfile ? handleDeletePost : undefined}
              highlight={post.id === highlightPostId}
            />
          ))}
        </Box>
      )}

      {isOwnProfile && (
        <EditProfileModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          initialData={{
            name: profile.name ?? '',
            bio: profile.bio ?? '',
            phone: profile.phone ?? '',
            zipCode: profile.zipCode ?? '',
            emailVisible: profile.emailVisible,
            tradeHistoryVisible: profile.tradeHistoryVisible,
            country: profile.country ?? '',
          }}
          onSave={handleUpdateProfile}
          avatarUrl={profile.avatarUrl}
          bannerUrl={profile.bannerUrl}
          avatarUploading={avatarUploading}
          bannerUploading={bannerUploading}
          onAvatarChange={handleAvatarChange}
          onAvatarRemove={handleAvatarRemove}
          onBannerChange={handleBannerChange}
          onBannerRemove={handleBannerRemove}
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
