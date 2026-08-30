/* eslint-disable react/jsx-one-expression-per-line */
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { type PostData, type PostUpdateData } from './ManagePosts';
import type { TradeRequestData } from '../Trades/RequestTradeButton';
import { useAuth } from '../../context/AuthContext';
import { useParams } from '../../context/RouterContext';
import Post from './Post';
import ReportDialog from './ReportDialog';
import SearchPosts from './SearchPosts';
import { useSocket } from '../../context/SocketContext';

export default function Posts() {
  const { user, blockedUserIds } = useAuth();
  const socket = useSocket();
  const { postId: highlightPostIdParam } = useParams();
  const highlightPostId = highlightPostIdParam ? Number(highlightPostIdParam) : undefined;

  const [posts, setPosts] = useState<PostData[]>([]);
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

  useEffect(() => {
    loadPosts(search);
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
    await Promise.all([loadPosts(search), loadMyTradeRequests()]);
  };

  useEffect(() => {
    if (!socket) return undefined;
    const handleChange = () => {
      loadPosts(search);
    };
    socket.on('posts:changed', handleChange);
    return () => {
      socket.off('posts:changed', handleChange);
    };
  }, [socket, search, loadPosts]);

  useEffect(() => {
    if (!highlightPostId) return;
    document.getElementById(`post-${highlightPostId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightPostId, posts]);

  // search posts
  const handleSearch = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadPosts(search);
  };

  // update a post
  const handleUpdatePost = async (
    postId: number,
    postData: PostUpdateData,
  ) => {
    try {
      setError('');
      await axios.patch(`/posts/${postId}`, postData);
      await loadPosts(search);
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
      await loadPosts(search);
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
      await loadPosts(search);
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
            highlight={post.id === highlightPostId}
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
