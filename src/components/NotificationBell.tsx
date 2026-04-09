import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { get, patch } from '../api';
import { supabaseClient } from '../supabase';

interface NotificationItem {
  id: string;
  title?: string;
  message?: string;
  body?: string;
  created_at?: string;
  is_read?: boolean;
}

interface NotificationsResponse {
  notifications: NotificationItem[];
}

export default function NotificationBell() {
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [markingNotificationId, setMarkingNotificationId] = useState<string | null>(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.length;

  const getRelativeTime = (createdAt?: string) => {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const fetchUnreadNotifications = async (showLoader: boolean = true) => {
    if (showLoader) {
      setIsLoadingNotifications(true);
    }
    setNotificationError(null);

    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session?.access_token) {
        setNotificationError('Unable to load notifications.');
        return;
      }

      const data = (await get(
        'api/v1/notifications?limit=10&unread_only=true',
        session.access_token,
      )) as NotificationsResponse;
      setNotifications(data.notifications ?? []);
    } catch (error) {
      console.error('error loading notifications', error);
      setNotificationError('Failed to load notifications.');
    } finally {
      if (showLoader) {
        setIsLoadingNotifications(false);
      }
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    setMarkingNotificationId(notificationId);
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session?.access_token) return;

      await patch(`api/v1/notifications/${notificationId}/read`, {}, session.access_token);
      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
    } catch (error) {
      console.error('error marking notification as read', error);
      setNotificationError('Failed to update notification.');
    } finally {
      setMarkingNotificationId(null);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (notifications.length === 0) return;

    setIsMarkingAllRead(true);
    setNotificationError(null);
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session?.access_token) return;

      await patch('api/v1/notifications/read-all', {}, session.access_token);
      setNotifications([]);
    } catch (error) {
      console.error('error marking all notifications as read', error);
      setNotificationError('Failed to mark all notifications as read.');
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const toggleNotificationsMenu = () => {
    const nextShow = !showNotificationsMenu;
    setShowNotificationsMenu(nextShow);

    if (nextShow) {
      fetchUnreadNotifications();
    }
  };

  useEffect(() => {
    fetchUnreadNotifications(false);

    const intervalId = window.setInterval(() => {
      fetchUnreadNotifications(false);
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!showNotificationsMenu) return;

    const onOutsideClick = (event: MouseEvent) => {
      if (
        notificationsMenuRef.current &&
        !notificationsMenuRef.current.contains(event.target as Node)
      ) {
        setShowNotificationsMenu(false);
      }
    };

    document.addEventListener('mousedown', onOutsideClick);
    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
    };
  }, [showNotificationsMenu]);

  return (
    <div className="relative" ref={notificationsMenuRef}>
      <button
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-slate-800"
        onClick={toggleNotificationsMenu}
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-500 rounded-full text-[11px] leading-[18px] text-white font-semibold text-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showNotificationsMenu && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 w-[320px] z-10 dark:bg-slate-900 dark:border-slate-700 dark:shadow-black/20">
          <div className="px-4 pb-2 mb-2 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Unread notifications</p>
              <button
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-60 dark:text-emerald-300 dark:hover:text-emerald-200"
                onClick={markAllNotificationsAsRead}
                disabled={isMarkingAllRead || notifications.length === 0}
              >
                {isMarkingAllRead ? 'Updating...' : 'Mark all as read'}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Showing 10 most recent unread items</p>
          </div>

          {isLoadingNotifications && (
            <p className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">Loading notifications...</p>
          )}

          {!isLoadingNotifications && notificationError && (
            <p className="px-4 py-3 text-sm text-red-600 dark:text-red-300">{notificationError}</p>
          )}

          {!isLoadingNotifications && !notificationError && notifications.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">No unread notifications.</p>
          )}

          {!isLoadingNotifications && !notificationError && notifications.length > 0 && (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 dark:hover:bg-slate-800 dark:border-slate-800"
                >
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-100">
                    {notification.title || 'Notification'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 dark:text-slate-300">
                    {notification.message || notification.body || 'You have a new update.'}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 dark:text-slate-400">
                      {getRelativeTime(notification.created_at)}
                    </span>
                    <button
                      className="text-xs font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-60 dark:text-emerald-300 dark:hover:text-emerald-200"
                      onClick={() => markNotificationAsRead(notification.id)}
                      disabled={markingNotificationId === notification.id}
                    >
                      {markingNotificationId === notification.id ? 'Updating...' : 'Mark as read'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}