import { useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';

 interface ContentScreened {
  targetType: string;
  targetId: number;
  ok: boolean;
  rationale?: string;
 }

const LABELS: Record<string, string> = {
  TRADE_OFFER: 'Your offer',
  TRADE_REQUEST: 'Your trade request',
  REVIEW: 'Your review',
  USER: 'Your bio update',
  POST: 'Your post',
};

export default function ScreeningNotifications() {
  const socket = useSocket();
  const { showToast } = useToast();

  useEffect(() => {
    if (!socket) return undefined;
    const handle = ({ targetType, ok, rationale }: ContentScreened) => {
      const label = LABELS[targetType] ?? 'Your submission';
      if (ok) showToast(`${label} is live!`, 'success');
      else showToast(`${label} didn't pass review: ${rationale}`, 'error');
    };
    socket.on('content:screened', handle);
    return () => { socket.off('content:screened', handle); };
  }, [socket, showToast]);

  return null;
}
