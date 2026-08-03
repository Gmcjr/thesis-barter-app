/* eslint-disable react/jsx-one-expression-per-line */
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';

import NewPost, { type PostFormData } from './NewPost';
import ManagePosts, { type PostData, type PostUpdateData } from './ManagePosts';
import ViewArtTradeOffer from './ViewArtTradeOffer';
import MyTrades from '../Trades/MyTrades';
import type { TradeRequestData } from '../Trades/RequestTradeButton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Post from './Post';
import ReportDialog from './ReportDialog';
import SearchPosts from './SearchPosts';
import { useSocket } from '../../context/SocketContext';

export default function Posts() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const socket = useSocket();

  const [modalOpen, setModalOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [viewArtOffersOpen, setViewArtOffersOpen] = useState(false);
  const [artOffersRefreshKey, setArtOffersRefreshKey] = useState(0);
  const [myTradesOpen, setMyTradesOpen] = useState(false);

  const [posts, setPosts] = useState<PostData[]>([]);
  const [ownedPosts, setOwnedPosts] = useState<PostData[]>([]);
  const [myTradeRequests, setMyTradeRequests] = useState<TradeRequestData[]>([]);

  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [reportDialogPostId, setReportDialogPostId] = useState<number | null>(null);

  // get posts and optionally send the search value (this is a general search)
  const loadPosts = useCallback(async (searchValue = '') => {
    try {
      setError('');
      const response = await axios.get<PostData[]>('/posts', {
        params: {
          q: searchValue,
        },
      });
      setPosts(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      console.error('Failed to get posts:', requestError);
      setPosts([]);
      setError('Failed to get posts');
    }
  }, []);

  // get all posts belonging to the logged-in user (this is a specific search)
  const loadOwnedPosts = useCallback(async () => {
    if (!user) {
      setOwnedPosts([]);
      return;
    }
    try {
      const response = await axios.get<PostData[]>('/posts', { params: { mine: true } });
      setOwnedPosts(response.data);
    } catch (requestError) {
      console.error('Failed to get user posts:', requestError);
      setError('Failed to get your posts');
    }
  // Server handles scoping via 'mine: true' in (server/routes/posts.ts)
  }, [user]);

  useEffect(() => {
    loadPosts().catch((requestError) => {
      console.error('Failed to load posts:', requestError);
    });
  }, [loadPosts]);

  const loadMyTradeRequests = useCallback(async () => {
    if (!user) { setMyTradeRequests([]); return; }
    try {
      const response = await axios.get<TradeRequestData[]>('/trade-requests/mine');
      setMyTradeRequests(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      console.error('Failed to get your trade requests:', requestError);
    }
  }, [user]);

  useEffect(() => {
    loadMyTradeRequests().catch((requestError) => {
      console.error('Failed to load trade requests', requestError);
    });
  }, [loadMyTradeRequests]);

  const handleTradeActivity = async () => {
    await Promise.all([loadPosts(search), loadOwnedPosts(), loadMyTradeRequests()]);
  };

  useEffect(() => {
    if (!socket) return undefined;
    const handleChange = () => {
      loadPosts(search);
      loadOwnedPosts();
    };
    socket.on('posts:changed', handleChange);
    return () => {
      socket.off('posts:changed', handleChange);
    };
  }, [socket, search, loadPosts, loadOwnedPosts]);

  // search posts
  const handleSearch = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadPosts(search).catch((requestError) => {
      console.error('Failed to search posts:', requestError);
    });
  };

  // create a post
  const handleCreatePost = async (formData: PostFormData) => {
    showToast('Post submitted - running automatic screening...', 'info');
    try {
      await axios.post('/posts', {
        title: formData.title,
        name: formData.name,
        offerType: formData.offerType,
        category: formData.category,
        message: formData.description,
        condition: formData.condition,
        isLocal: formData.isLocal,
        zipCode: formData.zipCode,
        radiusMiles: formData.radiusMiles,
        previewMediaId: formData.previewMediaId,
        fullMediaId: formData.fullMediaId,
      });

      showToast('Screening complete. Your post is live', 'success');

      await Promise.all([
        loadPosts(search),
        loadOwnedPosts(),
      ]);
    // Adds in 'violates community guidelines' message for a rejected post during pre-screen
    } catch (requestError) {
      console.error('Failed to create post:', requestError);
      const message = axios.isAxiosError(requestError) && requestError.response?.data?.error
        ? requestError.response.data.error
        : 'Could not create post - check your connection and try, try again.';
      showToast(message, 'error');
      throw requestError;
    }
  };

  // update a post
  const handleUpdatePost = async (
    postId: number,
    postData: PostUpdateData,
  ) => {
    try {
      setError('');

      await axios.patch(`/posts/${postId}`, postData);

      await Promise.all([
        loadPosts(search),
        loadOwnedPosts(),
      ]);
    } catch (requestError) {
      console.error('Failed to update post:', requestError);
      setError('Failed to update post');
    }
  };

  // delete a post
  const handleDeletePost = async (postId: number) => {
    try {
      setError('');

      await axios.delete(`/posts/${postId}`);

      await Promise.all([
        loadPosts(search),
        loadOwnedPosts(),
      ]);
    } catch (requestError) {
      console.error('Failed to delete post:', requestError);
      setError('Failed to delete post');
    }
  };

  // mark a trade as complete
  const handleCompleteTrade = async (tradeId: number) => {
    try {
      setError('');

      await axios.patch(`/trades/${tradeId}/complete`);

      await Promise.all([
        loadPosts(search),
        loadOwnedPosts(),
      ]);
    } catch (requestError) {
      console.error('Failed to complete trade:', requestError);
      setError('Failed to complete trade');
    }
  };

  const handleOpenManagePosts = async () => {
    await loadOwnedPosts();
    setManageOpen(true);
  };

  const handleOpenViewArtOffers = () => {
    setArtOffersRefreshKey((prev) => prev + 1);
    setViewArtOffersOpen(true);
  };

  const manageablePosts = ownedPosts.filter(
    (post) => post.status !== 'COMPLETED',
  );

  return (
    <Box sx={{ width: '100%', mt: -4 }}>

      {/* Search Bar */}
      <SearchPosts
        search={search}
        onSearchChange={setSearch}
        onSubmit={handleSearch}
      />

      {/* all of the Buttons underneath Search and their lovely formatting */}
      <Box
        sx={{
          display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, minmax(0, 1fr)) auto' }, alignItems: 'center', gap: { xs: 1, sm: 1.5 }, mb: 3, px: { xs: 2, md: 0 },
        }}
      >
        {/* View Art Offers Button */}
        <Button
          variant="contained"
          disabled={!user}
          onClick={handleOpenViewArtOffers}
          sx={{
            width: '100%', borderRadius: 8, textTransform: 'none', fontWeight: 'bold', px: 3,
          }}
        >
          View Art Offers
        </Button>

        {/* My Trades button */}
        <Button
          variant="contained"
          disabled={!user}
          onClick={() => setMyTradesOpen(true)}
          sx={{
            width: '100%', borderRadius: 8, textTransform: 'none', fontWeight: 'bold', px: 3,
          }}
        >
          My Trades
        </Button>

        {/* Manage Posts button */}
        <Button
          variant="contained"
          disabled={!user}
          onClick={() => handleOpenManagePosts()}
          sx={{
            width: '100%', borderRadius: 8, textTransform: 'none', fontWeight: 'bold', px: 3,
          }}
        >
          Manage Posts
        </Button>

        {/* New Post Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!user}
            onClick={() => setModalOpen(true)}
            sx={{
              width: { xs: '100%', sm: 'auto' }, borderRadius: 8, textTransform: 'none', fontWeight: 'bold', whiteSpace: 'nowrap', px: 3,
            }}
          >
            New Post
          </Button>
        </Box>
      </Box>

      {error && (
        <Typography
          color="error"
          sx={{
            mb: 2,
            px: { xs: 2, md: 0 },
          }}
        >
          {error}
        </Typography>
      )}

      {/* User Posts */}
      <Box sx={{
        display: 'flex', flexDirection: 'column', gap: 3, px: { xs: 2, md: 0 },
      }}
      >
        {posts.length === 0 && (
          <Typography color="text.secondary">
            No posts found.
          </Typography>
        )}

        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            onReport={() => setReportDialogPostId(post.id)}
            myTradeRequests={myTradeRequests.find((r) => r.postId === post.id) ?? null}
            onTradeActivity={handleTradeActivity}
          />
        ))}
      </Box>

      {/* NewPost Modal */}
      <NewPost
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreatePost}
      />

      {/* View Art Trade Offers Modal */}
      <ViewArtTradeOffer
        key={artOffersRefreshKey}
        open={viewArtOffersOpen}
        onClose={() => setViewArtOffersOpen(false)}
        onAccept={() => {
          setViewArtOffersOpen(false);
          loadOwnedPosts();
          loadPosts(search);
          showToast('Trade Accepted!', 'success');
        }}
      />

      {/* Manage Posts Modal */}
      <ManagePosts
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        posts={manageablePosts}
        currentUserId={user?.id}
        onUpdate={handleUpdatePost}
        onDelete={handleDeletePost}
        onComplete={handleCompleteTrade}
      />

      {/* My Trades Modal */}
      <MyTrades
        open={myTradesOpen}
        onClose={() => setMyTradesOpen(false)}
      />

      <ReportDialog
        open={reportDialogPostId !== null}
        onClose={() => setReportDialogPostId(null)}
        targetType="POST"
        targetId={reportDialogPostId ?? 0}
      />
    </Box>
  );
}
