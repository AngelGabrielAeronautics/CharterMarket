import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { getUnreadCount } from '@/lib/notification';

interface NotificationBadgeProps {
  userId: string;
}

export default function NotificationBadge({ userId }: NotificationBadgeProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const unreadCount = await getUnreadCount(userId);
        setCount(unreadCount);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();
    // Set up polling every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  if (loading) {
    return null;
  }

  return (
    <div className="relative">
      <Bell className="h-6 w-6 text-gray-600" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
} 