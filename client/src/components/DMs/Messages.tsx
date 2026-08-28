import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import SendIcon from '@mui/icons-material/Send';
import DeleteOutlineIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { radius } from '../../theme';
import {
  formatInboxTime, formatDayDivider, formatClockTime, isSameDay,
} from '../../utils/utils';

import { useParams, useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import UserAvatar from '../common/UserAvatar';

interface DMSummary {
  id: number;
  otherUser: { id: number; name: string; avatarUrl: string | null };
  lastMessage: { text: string; createdAt: string; senderId: number } | null;
}

interface DMMessage {
  id: number;
  dmId: number;
  senderId: number;
  recieverId: number;
  text: string;
  createdAt: string;
}

export default function Messages() {
  const { id } = useParams();
  const activeDmId = id ? Number(id) : null;
  const { navigate } = useRouter();
  const { user } = useAuth();
  const socket = useSocket();
  const { showToast } = useToast();

  const [inbox, setInbox] = useState<DMSummary[]>([]);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  // Fallback header info for a DM that was just opened but has no messages
  // yet, so it hasn't shown up in the inbox list.
  const [pendingConversation, setPendingConversation] = useState<DMSummary | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadInbox = useCallback(async () => {
    const res = await axios.get<DMSummary[]>('/dms', { withCredentials: true });
    setInbox(res.data);
  }, []);

  const appendMessage = (message: DMMessage) => {
    setMessages((prev) => (
      prev.some((m) => m.id === message.id) ? prev : [...prev, message]
    ));
  };

  useEffect(() => {
    setLoadingInbox(true);
    loadInbox().finally(() => setLoadingInbox(false));
  }, [loadInbox]);

  useEffect(() => {
    if (!activeDmId) {
      setMessages([]);
      return undefined;
    }
    let cancelled = false;
    setLoadingThread(true);
    axios.get<DMMessage[]>(`/dms/${activeDmId}/messages`, { withCredentials: true })
      .then((res) => { if (!cancelled) setMessages(res.data); })
      .finally(() => { if (!cancelled) setLoadingThread(false); });
    return () => { cancelled = true; };
  }, [activeDmId]);

  // If the active conversation isn't in the loaded inbox (e.g. it was just
  // opened and has no messages yet, or it's archived), fetch its header info.
  useEffect(() => {
    if (!activeDmId || inbox.some((c) => c.id === activeDmId)) {
      setPendingConversation(null);
      return undefined;
    }
    let cancelled = false;
    axios.get<{ id: number; otherUser: { id: number; name: string; avatarUrl: string | null } }>(`/dms/${activeDmId}`, { withCredentials: true })
      .then((res) => {
        if (cancelled) return;
        setPendingConversation({
          id: res.data.id, otherUser: res.data.otherUser, lastMessage: null,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activeDmId, inbox]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleIncoming = ({ dmId, message }: { dmId: number; message: DMMessage }) => {
      if (dmId === activeDmId) appendMessage(message);
      loadInbox();
    };

    socket.on('dm:message', handleIncoming);
    return () => { socket.off('dm:message', handleIncoming); };
  }, [socket, activeDmId, loadInbox]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !activeDmId) return;
    setDraft('');
    await axios.post(`/dms/${activeDmId}/messages`, { text }, { withCredentials: true });
    loadInbox();
  };

  const handleDelete = async (conversation: DMSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setInbox((prev) => prev.filter((c) => c.id !== conversation.id));
    if (activeDmId === conversation.id) navigate('/messages');

    try {
      await axios.patch(`/dms/${conversation.id}/archive`, { archived: true }, { withCredentials: true });
      showToast('Conversation deleted.', 'info', {
        label: 'Undo',
        onClick: async () => {
          await axios.patch(`/dms/${conversation.id}/archive`, { archived: false }, { withCredentials: true });
          loadInbox();
        },
      });
    } catch {
      showToast('Could not delete conversation.', 'error');
      loadInbox();
    }
  };

  const activeConversation = inbox.find((c) => c.id === activeDmId)
    ?? pendingConversation
    ?? undefined;

  return (
    <Box sx={{
      display: 'flex', gap: { xs: 0, md: 2 }, height: 'calc(100vh - 180px)', px: { xs: 0, md: 0 },
    }}
    >
      <Card
        variant="outlined"
        sx={{
          width: { xs: '100%', md: 280 },
          flexShrink: 0,
          borderRadius: radius.md,
          borderColor: 'border.default',
          overflowY: 'auto',
          display: { xs: activeDmId ? 'none' : 'block', md: 'block' },
        }}
      >
        {loadingInbox && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!loadingInbox && inbox.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 2 }}>
            No conversations yet.
          </Typography>
        )}

        {inbox.map((conversation) => (
          <Box
            key={conversation.id}
            onClick={() => navigate(`/messages/${conversation.id}`)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1.5,
              cursor: 'pointer',
              bgcolor: conversation.id === activeDmId ? 'action.selected' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <UserAvatar user={conversation.otherUser} size={40} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1, minWidth: 0 }} noWrap>
                  {conversation.otherUser.name}
                </Typography>
                {conversation.lastMessage && (
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {formatInboxTime(conversation.lastMessage.createdAt)}
                  </Typography>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {conversation.lastMessage?.text ?? 'No messages yet'}
              </Typography>
            </Box>
            <IconButton
              size="small"
              aria-label="Delete conversation"
              onClick={(e) => handleDelete(conversation, e)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Card>

      <Card
        variant="outlined"
        sx={{
          flex: 1,
          borderRadius: radius.md,
          borderColor: 'border.default',
          display: { xs: activeDmId ? 'flex' : 'none', md: 'flex' },
          flexDirection: 'column',
        }}
      >
        {!activeDmId && (
          <Box sx={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          >
            <Typography color="text.secondary">Select a conversation</Typography>
          </Box>
        )}

        {activeDmId && (
          <>
            <Box sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderBottom: (theme) => `1px solid ${theme.palette.border.default}`,
            }}
            >
              <IconButton
                size="small"
                aria-label="Back to conversations"
                onClick={() => navigate('/messages')}
                sx={{ display: { xs: 'inline-flex', md: 'none' } }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              {activeConversation?.otherUser ? (
                <Box
                  onClick={() => navigate(`/profile/${activeConversation.otherUser.id}`)}
                  role="button"
                  tabIndex={0}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    '&:hover .dm-header-name': { textDecoration: 'underline' },
                  }}
                >
                  <UserAvatar user={activeConversation.otherUser} size={32} />
                  <Typography variant="subtitle1" className="dm-header-name" sx={{ fontWeight: 600 }}>
                    {activeConversation.otherUser.name}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Conversation
                </Typography>
              )}
            </Box>

            <Box sx={{
              flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1,
            }}
            >
              {loadingThread && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <CircularProgress size={24} />
                </Box>
              )}

              {!loadingThread && messages.map((message, index) => {
                const isMine = message.senderId === user!.id;
                const prevMessage = messages[index - 1];
                const showDivider = !prevMessage
                  || !isSameDay(new Date(message.createdAt), new Date(prevMessage.createdAt));
                return (
                  <React.Fragment key={message.id}>
                    {showDivider && (
                      <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, my: 0.5,
                      }}
                      >
                        <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {formatDayDivider(message.createdAt)}
                        </Typography>
                        <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                      </Box>
                    )}
                    <Box sx={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                      <Box
                        sx={{
                          bgcolor: isMine ? 'primary.main' : 'surface.sunken',
                          color: isMine ? 'primary.contrastText' : 'text.primary',
                          borderRadius: radius.lg,
                          px: 1.5,
                          py: 0.75,
                        }}
                      >
                        <Typography variant="body2">{message.text}</Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'block', mt: 0.25, textAlign: isMine ? 'right' : 'left',
                        }}
                      >
                        {formatClockTime(message.createdAt)}
                      </Typography>
                    </Box>
                  </React.Fragment>
                );
              })}
              <div ref={bottomRef} />
            </Box>

            <Box sx={{
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              borderTop: (theme) => `1px solid ${theme.palette.border.default}`,
            }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Type a message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <IconButton color="primary" onClick={handleSend} disabled={!draft.trim()}>
                <SendIcon />
              </IconButton>
            </Box>
          </>
        )}
      </Card>
    </Box>
  );
}
