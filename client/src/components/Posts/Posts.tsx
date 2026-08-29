/* eslint-disable react/jsx-one-expression-per-line */
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { type PostData, type PostUpdateData } from './ManagePosts';
import type { TradeRequestData } from '../Trades/RequestTradeButton';
import { useAuth } from '../../context/AuthContext';
import Post from './Post';
import ReportDialog from './ReportDialog';
import SearchPosts from './SearchPosts';
import SearchPostsAdvanced, {
  EMPTY_ADVANCED_SEARCH,
  type AdvancedSearchFilters,
} from './SearchPostsAdvanced';
import { useSocket } from '../../context/SocketContext';

export default function Posts() {
  const { user, blockedUserIds } = useAuth();
  const socket = useSocket();

  const [posts, setPosts] = useState<PostData[]>([]);
  const [myTradeRequests, setMyTradeRequests] = useState<TradeRequestData[]>([]);

  const [search, setSearch] = useState('');
  const [advancedSearch, setAdvancedSearch] = useState<AdvancedSearchFilters>(
    EMPTY_ADVANCED_SEARCH,
  );
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [error, setError] = useState('');
  const [reportDialogPostId, setReportDialogPostId] = useState<number | null>(null);

  // get posts and optionally send the search value (this is a general search)
  const loadPosts = useCallback(async (
    searchValue = '',
    filters: AdvancedSearchFilters = EMPTY_ADVANCED_SEARCH,
  ) => {
    try {
      setError('');
      const response = await axios.get<PostData[]>('/posts', {
        params: {
          q: searchValue,
          title: filters.title || undefined,
          description: filters.description || undefined,
          listingType: filters.listingType || undefined,
          condition: filters.condition || undefined,
          hasImages: filters.hasImages || undefined,
          includeCompleted: filters.includeCompleted || undefined,
          dateMode: filters.dateMode || undefined,
          dateStart: filters.dateStart || undefined,
          dateEnd: filters.dateMode === 'between'
            ? filters.dateEnd || undefined
            : undefined,
          category: filters.category || undefined,
          distanceRange: filters.distanceRange || undefined,
          distancePostalCode: filters.distancePostalCode || undefined,
        },
      });
      setPosts(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      console.error('Failed to get posts:', requestError);
      setPosts([]);
      const message = axios.isAxiosError(requestError) && requestError.response?.data?.error
        ? requestError.response.data.error
        : 'Failed to get posts';
      setError(message);
    }
  }, []);

  useEffect(() => {
    loadPosts(search, advancedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadPosts, blockedUserIds]);

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
    await Promise.all([
      loadPosts(search, advancedSearch),
      loadMyTradeRequests(),
    ]);
  };

  useEffect(() => {
    if (!socket) return undefined;
    const handleChange = () => {
      loadPosts(search, advancedSearch);
    };
    socket.on('posts:changed', handleChange);
    return () => {
      socket.off('posts:changed', handleChange);
    };
  }, [socket, search, advancedSearch, loadPosts]);

  // search posts
  const handleSearch = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdvancedSearch(EMPTY_ADVANCED_SEARCH);
    loadPosts(search, EMPTY_ADVANCED_SEARCH);
  };

  const handleAdvancedSearch = (filters: AdvancedSearchFilters) => {
    setSearch('');
    setAdvancedSearch(filters);
    setAdvancedSearchOpen(false);
    loadPosts('', filters);
  };

  const handleAdvancedSearchCancel = () => {
    setSearch('');
    setAdvancedSearch(EMPTY_ADVANCED_SEARCH);
    setAdvancedSearchOpen(false);
    loadPosts('', EMPTY_ADVANCED_SEARCH);
  };

  // update a post
  const handleUpdatePost = async (
    postId: number,
    postData: PostUpdateData,
  ) => {
    try {
      setError('');
      await axios.patch(`/posts/${postId}`, postData);
      await loadPosts(search, advancedSearch);
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
      await loadPosts(search, advancedSearch);
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
      await loadPosts(search, advancedSearch);
    } catch (requestError) {
      console.error('Failed to complete trade:', requestError);
      setError('Failed to complete trade');
    }
  };

  return (
    <Box sx={{ width: '100%', mt: -4 }}>

      {/* Search Bar */}
      <SearchPosts
        search={search}
        onSearchChange={setSearch}
        onSubmit={handleSearch}
        onAdvancedSearchClick={() => setAdvancedSearchOpen(true)}
      />

      <SearchPostsAdvanced
        open={advancedSearchOpen}
        onClose={handleAdvancedSearchCancel}
        filters={advancedSearch}
        onApply={handleAdvancedSearch}
      />

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
            onOfferSubmitted={handleTradeActivity}
            onUpdate={handleUpdatePost}
            onDelete={handleDeletePost}
            onComplete={handleCompleteTrade}
          />
        ))}
      </Box>

      <ReportDialog
        open={reportDialogPostId !== null}
        onClose={() => setReportDialogPostId(null)}
        targetType="POST"
        targetId={reportDialogPostId ?? 0}
      />
    </Box>
  );
}
