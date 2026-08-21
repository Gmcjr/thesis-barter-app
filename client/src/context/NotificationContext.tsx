import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import axios from 'axios';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  entityType: string | null;
  entityId: number | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  deleteMany: (id: number[]) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const socket = useSocket();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    const [listRes, countRes] = await Promise.all([
      axios.get('/notifications', { withCredentials: true }),
      axios.get('/notifications/unread-count', { withCredentials: true }),
    ]);
    setNotifications(listRes.data);
    setUnreadCount(countRes.data.count);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!socket || !user) return undefined;

    const handleNew = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((count) => count + 1);
      showToast(notification.body ? `${notification.title}: ${notification.body}` : notification.title, 'info');
    };

    socket.on('notification:new', handleNew);
    return () => { socket.off('notification:new', handleNew); };
  }, [socket, user, showToast]);

  const markRead = useCallback(async (id: number) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.readAt) return;
    await axios.patch(`/notifications/${id}/read`, {}, { withCredentials: true });
    setNotifications((prev) => prev
      .map((n) => (n.id === id
        ? { ...n, readAt: new Date().toISOString() }
        : n)));
    setUnreadCount((count) => Math.max(0, count - 1));
  }, [notifications]);

  const markAllRead = useCallback(async () => {
    await axios.patch('/notifications/read-all', {}, { withCredentials: true });
    setNotifications((prev) => prev
      .map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    const target = notifications.find((n) => n.id === id);
    if (!target) return;
    await axios.delete(`/notifications/${id}`, { withCredentials: true });
    setNotifications((prev) => prev
      .filter((n) => n.id !== id));
    if (!target.readAt) setUnreadCount((count) => Math.max(0, count - 1));
    setUnreadCount((count) => Math.max(0, count - 1));
  }, [notifications]);

  const deleteMany = useCallback(async (ids: number[]) => {
    const idSet = new Set(ids);
    const unreadRemoved = notifications.filter((n) => idSet.has(n.id) && !n.readAt).length;
    await axios.delete('/notifications', { data: { ids }, withCredentials: true });
    setNotifications((prev) => prev
      .filter((n) => !idSet.has(n.id)));
    setUnreadCount((count) => Math.max(0, count - unreadRemoved));
  }, [notifications]);

  const value = useMemo(() => ({
    notifications, unreadCount, markRead, markAllRead, deleteNotification, deleteMany, refresh,
  }), [notifications, unreadCount, markRead, markAllRead, deleteNotification, deleteMany, refresh]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
