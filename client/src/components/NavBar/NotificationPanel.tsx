import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useNotifications, type Notification } from '../../context/NotificationContext';
import { useRouter } from '../../context/RouterContext';
import { groupByBucket } from '../../utils/notificationBuckets';
import {
  ALL_CATEGORIES, categoryFor, categoryLabel, type NotificationCategory,
} from '../../utils/notificationCategory';

interface NotificationPanelProps {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const {
    notifications, markRead, markAllRead, deleteNotification, deleteMany,
  } = useNotifications();
  const { navigate } = useRouter();

  const [category, setCategory] = useState<NotificationCategory | 'all'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const visible = useMemo(() => notifications.filter((n) => {
    if (unreadOnly && n.readAt) return false;
    if (category !== 'all' && categoryFor(n.type) !== category) return false;
    return true;
  }), [notifications, unreadOnly, category]);

  const grouped = useMemo(() => groupByBucket(visible), [visible]);

  const hasUnread = notifications.some((n) => !n.readAt);
  const hasSelection = selectedIds.size > 0;
  const allVisibleSelected = visible.length > 0 && visible.every((n) => selectedIds.has(n.id));

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(allVisibleSelected ? new Set() : new Set(visible.map((n) => n.id)));
  };

  const toggleSelectMode = () => {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  };

  const handleRowClick = async (n: Notification) => {
    if (selectMode) {
      toggleSelect(n.id);
      return;
    }
    await markRead(n.id);
    onClose();
    if (n.link) navigate(n.link);
  };

  const handleMarkSelectedRead = async () => {
    await Promise.all(Array.from(selectedIds).map((id) => markRead(id)));
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    await deleteMany(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', height: '100%',
    }}
    >
      <Box sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1,
      }}
      >
        <Typography variant="subtitle2">Notifications</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {hasUnread && !selectMode && (
            <Typography
              variant="caption"
              color="primary"
              sx={{ cursor: 'pointer' }}
              onClick={() => { markAllRead(); }}
            >
              Mark all read
            </Typography>
          )}
          <Button size="small" onClick={toggleSelectMode} sx={{ minWidth: 0, textTransform: 'none' }}>
            {selectMode ? 'Cancel' : 'Select'}
          </Button>
        </Box>
      </Box>

      <Tabs
        value={category}
        onChange={(_e, value) => setCategory(value)}
        variant="scrollable"
        scrollButtons={false}
        sx={{ minHeight: 36, px: 1 }}
      >
        <Tab label="All" value="all" sx={{ minHeight: 36, py: 0 }} />
        {ALL_CATEGORIES.map((c) => (
          <Tab key={c} label={categoryLabel(c)} value={c} sx={{ minHeight: 36, py: 0 }} />
        ))}
      </Tabs>

      <Box sx={{ px: 2, pb: 1 }}>
        <Typography
          variant="caption"
          color={unreadOnly ? 'primary' : 'text.secondary'}
          sx={{ cursor: 'pointer' }}
          onClick={() => setUnreadOnly((v) => !v)}
        >
          {unreadOnly ? 'x Unread only' : 'Unread only'}
        </Typography>
      </Box>

      <Divider />

      {selectMode && hasSelection && (
        <>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1,
          }}
          >
            <Typography variant="caption" sx={{ flexGrow: 1 }}>
              {selectedIds.size}
              selected
            </Typography>
            <IconButton size="small" onClick={handleMarkSelectedRead} title="Mark selected read">
              <DoneAllIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleDeleteSelected} title="Delete selected">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
          <Divider />
        </>
      )}

      {selectMode && (
        <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
          <Checkbox
            size="small"
            checked={allVisibleSelected}
            indeterminate={hasSelection && !allVisibleSelected}
            onChange={toggleSelectAll}
            disabled={visible.length === 0}
          />
          <Typography variant="caption" color="text.secondary">Select all</Typography>
        </Box>
      )}

      <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
        {visible.length === 0 && (
          <Typography color="text.secondary" sx={{ px: 2, py: 2 }}>
            Nothing to see here.
          </Typography>
        )}

        {grouped.map((group) => (
          <Box key={group.bucket}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block', px: 2, pt: 1.5, pb: 0.5, fontWeight: 600,
              }}
            >
              {group.bucket}
            </Typography>
            {group.items.map((n) => (
              <Box
                key={n.id}
                onClick={() => handleRowClick(n)}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  px: 1,
                  py: 0.75,
                  cursor: 'pointer',
                  borderLeft: '3px solid',
                  borderLeftColor: n.readAt ? 'transparent' : 'primary.main',
                  '&:hover': { bgcolor: 'surface.sunken' },
                }}
              >
                {selectMode && (
                  <Checkbox
                    size="small"
                    checked={selectedIds.has(n.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelect(n.id)}
                  />
                )}
                <Box sx={{ flexGrow: 1, minWidth: 0, px: selectMode ? 0 : 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: n.readAt ? 400 : 600 }}>
                    {n.title}
                  </Typography>
                  {n.body && (
                    <Typography variant="caption" color="text.secondary">
                      {n.body}
                    </Typography>
                  )}
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                  title="Delete"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
