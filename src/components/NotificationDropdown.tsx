import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Notification } from '@/types/notification';
import { getUserNotifications, markNotificationAsRead } from '@/lib/notification';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface NotificationDropdownProps {
  userId: string;
}

export default function NotificationDropdown({ userId }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="default"
        onClick={handleBellClick}
        className="relative w-10 h-10 p-2 flex items-center justify-center"
      >
        <Bell className="h-6 w-6 text-gray-600" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                <Link
                  href="/dashboard/notifications"
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  View All
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
              </div>
            ) : error ? (
              <div className="px-4 py-2 text-sm text-red-600">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">No notifications</div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {format(notification.createdAt.toDate(), 'MMM d, h:mm a')}
                          </span>
                          {notification.link && (
                            <Link
                              href={notification.link}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              View
                            </Link>
                          )}
                        </div>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="default"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="ml-2 w-8 h-8 p-1 flex items-center justify-center text-gray-400 hover:text-gray-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 