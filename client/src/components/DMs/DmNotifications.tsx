import { useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useRouter } from '../../context/RouterContext';

interface IncomingDm {
  dmId: number;
  message: { senderId: number; text: string };
  senderName: string | null;
}

export default function DmNotifications() {
  const socket = useSocket();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { path } = useRouter();

  useEffect(() => {
    if (!socket || !user) return undefined;

    const handleIncoming = ({ dmId, message, senderName }: IncomingDm) => {
      if (message.senderId === user.id) return; // your own message, echoed to your other tabs
      if (path === `/messages/${dmId}`) return; // already looking at this conversation

      const preview = message.text.length > 80 ? `${message.text.slice(0, 80)}…` : message.text;
      showToast(`${senderName ?? 'New message'}: ${preview}`, 'info');
    };

    socket.on('dm:message', handleIncoming);
    return () => { socket.off('dm:message', handleIncoming); };
  }, [socket, user, path, showToast]);

  return null;
}
