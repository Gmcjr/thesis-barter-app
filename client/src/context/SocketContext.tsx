import React, {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!userId) {
      setSocket(null);
      return undefined;
    }
    const s = io({ withCredentials: true });
    s.on('connect', () => console.log('[socket] connected', s.id));
    s.on('connect_error', (err) => console.log('[socket] connect_error', err.message));
    s.on('disconnect', (reason) => console.log('[socket] disconnected', reason));
    setSocket(s);
    return () => { s.disconnect(); };
  }, [userId]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
