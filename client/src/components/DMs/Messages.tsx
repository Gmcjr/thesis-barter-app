import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import SendIcon from '@mui/icons-material/Send';

import { useParams, useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

interface DMSummary {
  id: number;
  otherUser: { id: number; name: string };
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

  const [inbox, setInbox] = useState<DMSummary[]>([]);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
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

  const activeConversation = inbox.find((c) => c.id === activeDmId);

  return (
    <Box sx={{
      display: 'flex', gap: 2, height: 'calc(100vh - 180px)', px: { xs: 2, md: 0 },
    }}
    >
      <Card
        variant="outlined"
        sx={{
          width: 280, flexShrink: 0, borderRadius: 3, borderColor: 'border.default', overflowY: 'auto',
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
            <Avatar sx={{ width: 40, height: 40 }}>
              {conversation.otherUser.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {conversation.otherUser.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {conversation.lastMessage?.text ?? 'No messages yet'}
              </Typography>
            </Box>
          </Box>
        ))}
      </Card>

      <Card
        variant="outlined"
        sx={{
          flex: 1, borderRadius: 3, borderColor: 'border.default', display: 'flex', flexDirection: 'column',
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
            <Box sx={{ p: 2, borderBottom: (theme) => `1px solid ${theme.palette.border.default}` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {activeConversation?.otherUser.name ?? 'Conversation'}
              </Typography>
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

              {!loadingThread && messages.map((message) => {
                const isMine = message.senderId === user!.id;
                return (
                  <Box
                    key={message.id}
                    sx={{
                      alignSelf: isMine ? 'flex-end' : 'flex-start',
                      bgcolor: isMine ? 'primary.main' : 'black',
                      color: 'primary.contrastText',
                      borderRadius: 3,
                      px: 1.5,
                      py: 0.75,
                      maxWidth: '70%',
                    }}
                  >
                    <Typography variant="body2">{message.text}</Typography>
                  </Box>
                );
              })}
              <div ref={bottomRef} />
            </Box>

            <Box sx={{
              p: 1.5, borderTop: (theme) => `1px solid ${theme.palette.border.default}`,
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
