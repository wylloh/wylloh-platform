import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Flag as FlagIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

interface Notification {
  id: string;
  type: 'flag' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/notifications`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      enqueueSnackbar('Failed to load notifications', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/notifications/${id}/read`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to mark notification as read');
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (err) {
      enqueueSnackbar('Failed to mark notification as read', { variant: 'error' });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/notifications/read-all`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      enqueueSnackbar('Failed to mark all notifications as read', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/notifications/${id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to delete notification');
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      enqueueSnackbar('Failed to delete notification', { variant: 'error' });
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'flag':
        return <FlagIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'info':
        return <InfoIcon color="info" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleClick}
          sx={{ ml: 1 }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 360, maxHeight: 480 }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </Box>
        <Divider />
        <List sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No notifications"
                sx={{ textAlign: 'center', color: 'text.secondary' }}
              />
            </ListItem>
          ) : (
            notifications.map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  bgcolor: notification.read ? 'inherit' : 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(notification.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
                <Box>
                  {!notification.read && (
                    <Tooltip title="Mark as read">
                      <IconButton
                        size="small"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <DoneAllIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(notification.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
            ))
          )}
        </List>
      </Menu>
    </>
  );
};

export default NotificationCenter; 