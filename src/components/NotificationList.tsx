"use client";

import { useEffect, useState } from 'react';
import { Check, Close as CloseIcon, AccessTime, Info as InfoIcon, Notifications as NotificationsIcon, Warning as WarningIcon } from '@mui/icons-material';
import { Notification } from '@/types/notification';
import { getUserNotifications, markNotificationAsRead } from '@/lib/notification';
import { format } from 'date-fns';
import Link from 'next/link';
import { Box, Paper, Typography, Stack, IconButton, CircularProgress, Button } from '@mui/material';

interface NotificationListProps {
  userId: string;
  limit?: number;
}

export default function NotificationList({ userId, limit = 20 }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const fetchedNotifications = await getUserNotifications(userId, limit);
        setNotifications(fetchedNotifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userId, limit]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'REQUEST_SUBMITTED':
      case 'QUOTE_RECEIVED':
      case 'QUOTE_ACCEPTED':
        return <NotificationsIcon fontSize="small" color="primary" />;
      case 'PAYMENT_REQUIRED':
      case 'PAYMENT_RECEIVED':
        return <Check fontSize="small" color="success" />;
      case 'FLIGHT_CONFIRMED':
      case 'FLIGHT_CANCELLED':
        return <AccessTime fontSize="small" color="info" />;
      case 'DOCUMENTS_REQUIRED':
      case 'DOCUMENTS_APPROVED':
        return <InfoIcon fontSize="small" color="info" />;
      case 'FLIGHT_REMINDER':
      case 'FLIGHT_COMPLETED':
        return <WarningIcon fontSize="small" color="warning" />;
      default:
        return <InfoIcon fontSize="small" color="disabled" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'REQUEST_SUBMITTED':
      case 'QUOTE_RECEIVED':
        return { bgcolor: 'info.lighter', color: 'info.dark' };
      case 'QUOTE_ACCEPTED':
      case 'PAYMENT_RECEIVED':
      case 'FLIGHT_CONFIRMED':
        return { bgcolor: 'success.lighter', color: 'success.dark' };
      case 'PAYMENT_REQUIRED':
      case 'DOCUMENTS_REQUIRED':
        return { bgcolor: 'warning.lighter', color: 'warning.dark' };
      case 'FLIGHT_CANCELLED':
        return { bgcolor: 'error.lighter', color: 'error.dark' };
      case 'DOCUMENTS_APPROVED':
      case 'FLIGHT_COMPLETED':
        return { bgcolor: 'secondary.lighter', color: 'secondary.dark' };
      case 'FLIGHT_REMINDER':
        return { bgcolor: 'primary.lighter', color: 'primary.dark' };
      default:
        return { bgcolor: 'grey.100', color: 'text.secondary' };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <CircularProgress color="primary" size={32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ bgcolor: 'error.lighter', color: 'error.dark', p: 2, mb: 2, borderRadius: 2 }}>
        {error}
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      {notifications.map((notification) => {
        const color = getNotificationColor(notification.type);
        return (
          <Paper
            key={notification.id}
            elevation={notification.read ? 0 : 2}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: notification.read ? 'divider' : 'primary.light',
              bgcolor: notification.read ? 'background.paper' : 'primary.lighter',
              boxShadow: notification.read ? 0 : 2,
              transition: 'background 0.2s',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: '50%',
                    ...color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 32,
                    minHeight: 32,
                  }}
                >
                  {getNotificationIcon(notification.type)}
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.primary">
                    {notification.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {notification.message}
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center" mt={1}>
                    <Typography variant="caption" color="text.disabled">
                      {notification.createdAt?.toDate ? format(notification.createdAt.toDate(), 'MMM d, yyyy h:mm a') : '-'}
                    </Typography>
                    {notification.link && (
                      <Button
                        component={Link}
                        href={notification.link}
                        variant="text"
                        size="small"
                        sx={{ textTransform: 'none', fontSize: '0.8rem', color: 'primary.main', p: 0 }}
                      >
                        View Details
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Box>
              {!notification.read && (
                <IconButton
                  size="small"
                  onClick={() => handleMarkAsRead(notification.id)}
                  sx={{ color: 'text.disabled', ml: 1 }}
                  aria-label="Mark as read"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Paper>
        );
      })}
      {notifications.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          No notifications found.
        </Box>
      )}
    </Stack>
  );
} 