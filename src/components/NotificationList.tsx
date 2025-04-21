import { useEffect, useState } from 'react';
import { Bell, Check, Clock, AlertCircle, Info, X } from 'lucide-react';
import { Notification } from '@/types/notification';
import { getUserNotifications, markNotificationAsRead } from '@/lib/notification';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

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
        return <Bell className="h-5 w-5" />;
      case 'PAYMENT_REQUIRED':
      case 'PAYMENT_RECEIVED':
        return <Check className="h-5 w-5" />;
      case 'FLIGHT_CONFIRMED':
      case 'FLIGHT_CANCELLED':
        return <Clock className="h-5 w-5" />;
      case 'DOCUMENTS_REQUIRED':
      case 'DOCUMENTS_APPROVED':
        return <Info className="h-5 w-5" />;
      case 'FLIGHT_REMINDER':
      case 'FLIGHT_COMPLETED':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'REQUEST_SUBMITTED':
      case 'QUOTE_RECEIVED':
        return 'bg-blue-100 text-blue-800';
      case 'QUOTE_ACCEPTED':
      case 'PAYMENT_RECEIVED':
      case 'FLIGHT_CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PAYMENT_REQUIRED':
      case 'DOCUMENTS_REQUIRED':
        return 'bg-yellow-100 text-yellow-800';
      case 'FLIGHT_CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'DOCUMENTS_APPROVED':
      case 'FLIGHT_COMPLETED':
        return 'bg-purple-100 text-purple-800';
      case 'FLIGHT_REMINDER':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-sm border ${
            notification.read ? 'bg-white' : 'bg-blue-50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{notification.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                <div className="mt-2 flex items-center space-x-4">
                  <span className="text-xs text-gray-400">
                    {format(notification.createdAt.toDate(), 'MMM d, yyyy h:mm a')}
                  </span>
                  {notification.link && (
                    <Link
                      href={notification.link}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            </div>
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMarkAsRead(notification.id)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
      {notifications.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No notifications found.
        </div>
      )}
    </div>
  );
} 