import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import useMediaQuery from '@mui/material/useMediaQuery';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckIcon from '@mui/icons-material/Check';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import CloseIcon from '@mui/icons-material/Close';
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
    notifications, markRead, markUnread, markAllRead,
    deleteNotification, deleteMany,
    archiveNotification, unarchiveNotification, archiveMany,
    archivedLoaded, refreshArchived,
  } = useNotifications();
  const { navigate } = useRouter();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const [category, setCategory] = useState<NotificationCategory | 'all'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [menuTarget, setMenuTarget] = useState<Notification | null>(null);

  const visible = useMemo(() => notifications.filter((n) => {
    if (showArchived ? !n.archivedAt : !!n.archivedAt) return false;
    if (unreadOnly && n.readAt) return false;
    if (category !== 'all' && categoryFor(n.type) !== category) return false;
    return true;
  }), [notifications, showArchived, unreadOnly, category]);

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

  const toggleShowArchived = () => {
    setShowArchived((prev) => {
      const next = !prev;
      if (next && !archivedLoaded) refreshArchived();
      return next;
    });
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

  const handleMarkSelectedUnread = async () => {
    await Promise.all(Array.from(selectedIds).map((id) => markUnread(id)));
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    await deleteMany(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleArchiveSelected = async () => {
    await archiveMany(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const openMenu = (e: React.MouseEvent<HTMLElement>, n: Notification) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
    setMenuTarget(n);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
    setMenuTarget(null);
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

      <Box sx={{
        px: 2, pb: 1, display: 'flex', gap: 2,
      }}
      >
        <Typography
          variant="caption"
          color={unreadOnly ? 'primary' : 'text.secondary'}
          sx={{
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.25,
          }}
          onClick={() => setUnreadOnly((v) => !v)}
        >
          {unreadOnly && <CheckIcon fontSize="inherit" />}
          Unread only
        </Typography>
        <Typography
          variant="caption"
          component="span"
          color={showArchived ? 'primary' : 'text.secondary'}
          sx={{
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 0.25,
          }}
          onClick={toggleShowArchived}
        >
          {showArchived && <CheckIcon fontSize="inherit" />}
          Show archived
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
            <IconButton size="small" onClick={handleMarkSelectedUnread} title="Mark selected unread">
              <MarkEmailUnreadIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleArchiveSelected} title="Archive selected">
              <ArchiveIcon fontSize="small" />
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
                  onClick={(e) => openMenu(e, n)}
                  aria-label={`Actions for notification: ${n.title}`}
                  aria-haspopup="true"
                  aria-expanded={menuAnchorEl !== null && menuTarget?.id === n.id}
                  aria-controls={menuAnchorEl !== null && menuTarget?.id === n.id ? 'notification-row-menu' : undefined}
                  id={`notification-row-menu-trigger-${n.id}`}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      <Menu
        id="notification-row-menu"
        anchorEl={menuAnchorEl}
        open={menuAnchorEl !== null}
        onClose={closeMenu}
        slotProps={{
          list: { 'aria-labelledby': menuTarget ? `notification-row-menu-trigger-${menuTarget.id}` : undefined },
        }}
        transitionDuration={prefersReducedMotion ? 0 : undefined}
      >
        {menuTarget && !menuTarget.readAt && !menuTarget.archivedAt && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              markRead(menuTarget.id);
              closeMenu();
            }}
          >
            <ListItemIcon>
              <CheckIcon fontSize="small" sx={{ color: 'primary.light' }} />
            </ListItemIcon>
            <ListItemText>Mark as read</ListItemText>
          </MenuItem>
        )}
        {menuTarget && menuTarget.readAt && !menuTarget.archivedAt && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              markUnread(menuTarget.id);
              closeMenu();
            }}
          >
            <ListItemIcon>
              <MarkEmailUnreadIcon fontSize="small" sx={{ color: 'primary.light' }} />
            </ListItemIcon>
            <ListItemText>Mark as unread</ListItemText>
          </MenuItem>
        )}
        {menuTarget && !menuTarget.archivedAt && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              archiveNotification(menuTarget.id);
              closeMenu();
            }}
          >
            <ListItemIcon>
              <ArchiveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Archive</ListItemText>
          </MenuItem>
        )}
        {menuTarget && menuTarget.archivedAt && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              unarchiveNotification(menuTarget.id);
              closeMenu();
            }}
          >
            <ListItemIcon>
              <UnarchiveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Unarchive</ListItemText>
          </MenuItem>
        )}
        {menuTarget && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation();
              deleteNotification(menuTarget.id);
              closeMenu();
            }}
          >
            <ListItemIcon>
              <CloseIcon fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
