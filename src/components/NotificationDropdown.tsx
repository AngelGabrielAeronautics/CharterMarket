'use client';

import { useState, useRef } from 'react';
import { Notification } from '@/types/notification';
import { getUserNotifications, markNotificationAsRead } from '@/lib/notification';
import { format } from 'date-fns';
import Link from 'next/link';
import { 
  Box, 
  IconButton, 
  Badge, 
  Popper, 
  Grow, 
  Paper, 
  ClickAwayListener, 
  Typography, 
  Divider, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  useTheme as useMuiTheme
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';

interface NotificationDropdownProps {
  userId: string;
}

export default function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const theme = useMuiTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = async () => {
    try {
      const fetchedNotifications = await getUserNotifications(userId, 5);
      setNotifications(fetchedNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

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

  const handleBellClick = async () => {
    if (!isOpen) {
      await fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    setIsOpen(false);
  };

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <Box>
      <IconButton
        ref={anchorRef}
        onClick={handleBellClick}
        size="medium"
        color="inherit"
        aria-label="notifications"
        sx={{ color: 'text.secondary' }}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popper
        open={isOpen}
        anchorEl={anchorRef.current}
        placement="bottom-end"
        transition
        sx={{ 
          zIndex: theme.zIndex.modal,
          width: { 
            xs: `calc(100vw - ${theme.spacing(4)})`, 
            sm: theme.spacing(40) 
          }
        }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper 
              elevation={4} 
              sx={{ 
                borderRadius: theme.shape.borderRadius,
                overflow: 'hidden'
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <Box>
                  <Box sx={{ 
                    p: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    borderBottom: 1,
                    borderColor: 'divider'
                  }}>
                    <Typography variant="subtitle2">
                      Notifications
                    </Typography>
                    <Typography
                      component={Link}
                      href="/dashboard/notifications"
                      variant="caption"
                      color="primary.main"
                      sx={{ textDecoration: 'none' }}
                    >
                      View All
                    </Typography>
                  </Box>

                  {loading ? (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      p: 4 
                    }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : error ? (
                    <Box sx={{ px: 2, py: 2 }}>
                      <Typography variant="body2" color="error">
                        {error}
                      </Typography>
                    </Box>
                  ) : notifications.length === 0 ? (
                    <Box sx={{ px: 2, py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No notifications
                      </Typography>
                    </Box>
                  ) : (
                    <List 
                      sx={{ 
                        maxHeight: theme.spacing(48), 
                        overflow: 'auto',
                        p: 0
                      }}
                    >
                      {notifications.map((notification) => (
                        <ListItem
                          key={notification.id}
                          sx={{ 
                            px: 2, 
                            py: 1.5,
                            bgcolor: !notification.read ? 'action.selected' : 'transparent',
                            '&:hover': { bgcolor: 'action.hover' },
                            borderBottom: 1,
                            borderColor: 'divider'
                          }}
                        >
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'flex-start' 
                            }}>
                              <ListItemText
                                primary={notification.title}
                                secondary={notification.message}
                                primaryTypographyProps={{ 
                                  variant: 'body2',
                                  fontWeight: 'medium',
                                  color: 'text.primary'
                                }}
                                secondaryTypographyProps={{ 
                                  variant: 'caption',
                                  color: 'text.secondary'
                                }}
                              />
                              {!notification.read && (
                                <IconButton 
                                  size="small"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  sx={{ ml: 1, color: 'text.disabled' }}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                            
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mt: 0.5
                            }}>
                              <Typography variant="caption" color="text.disabled">
                                {format(notification.createdAt.toDate(), 'MMM d, h:mm a')}
                              </Typography>
                              
                              {notification.link && (
                                <Typography
                                  component={Link}
                                  href={notification.link}
                                  variant="caption"
                                  color="primary.main"
                                  sx={{ textDecoration: 'none' }}
                                >
                                  View
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  );
} 