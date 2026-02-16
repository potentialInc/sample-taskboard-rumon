import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { UserPlus, Clock, AtSign, ArrowRight, MessageCircle, Loader2 } from 'lucide-react';
import MobileShell from '~/components/layout/MobileShell';
import BottomNav from '~/components/layout/BottomNav';
import { PageLoader } from '~/components/ui/loading-spinner';
import { EmptyState } from '~/components/ui/empty-state';
import { cn } from '~/lib/utils';
import { notificationService } from '~/services/httpServices/notificationService';
import { useAppDispatch } from '~/redux/store/hooks';
import {
  setNotifications as setNotificationsAction,
  setUnreadCount,
  markAsRead as markAsReadAction,
  markAllRead as markAllReadAction,
} from '~/redux/features/notificationSlice';
import type { Notification, NotificationType } from '~/types/notification';

const iconMap: Record<NotificationType, { icon: typeof UserPlus; color: string }> = {
  task_assigned: { icon: UserPlus, color: 'text-[#4A90D9]' },
  due_date_reminder: { icon: Clock, color: 'text-[#F59E0B]' },
  comment_mention: { icon: AtSign, color: 'text-[#8B5CF6]' },
  status_change: { icon: ArrowRight, color: 'text-[#10B981]' },
  new_comment: { icon: MessageCircle, color: 'text-[#3B82F6]' },
  project_invitation: { icon: UserPlus, color: 'text-[#4A90D9]' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [data, unreadData] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount().catch(() => ({ count: 0 })),
      ]);

      setNotifications(data.notifications);
      dispatch(setNotificationsAction(data.notifications));
      dispatch(setUnreadCount(unreadData.count));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: string }).message) : 'Failed to load notifications';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = async () => {
    if (markingAllRead) return;
    setMarkingAllRead(true);

    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      dispatch(markAllReadAction());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to mark all as read';
      setError(message);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead && !markingRead) {
      setMarkingRead(notification.id);
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        dispatch(markAsReadAction(notification.id));
      } catch {
        // Silently fail - don't block navigation
      } finally {
        setMarkingRead(null);
      }
    }

    // Navigate based on notification type
    if (notification.data?.taskId) {
      navigate(`/tasks/${notification.data.taskId}`);
    } else if (notification.data?.projectId) {
      navigate(`/projects/${notification.data.projectId}/board`);
    }
  };

  const formatTimestamp = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <MobileShell>
        <header className="bg-white h-[56px] flex items-center justify-between px-4 shrink-0 z-20 border-b border-[#E5E7EB]">
          <h2 className="text-lg font-semibold tracking-tight text-[#1E293B]">Notifications</h2>
        </header>
        <PageLoader />
        <BottomNav />
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <header className="bg-white h-[56px] flex items-center justify-between px-4 shrink-0 z-20 border-b border-[#E5E7EB]">
        <h2 className="text-lg font-semibold tracking-tight text-[#1E293B]">Notifications</h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAllRead}
            className="text-sm font-medium text-[#4A90D9] hover:text-[#3B82F6] transition-colors whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5"
          >
            {markingAllRead && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Mark all as read
          </button>
        )}
      </header>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center justify-between">
          <p className="text-xs text-red-600">{error}</p>
          <button onClick={fetchNotifications} className="text-red-500 hover:text-red-700 text-xs font-medium">Retry</button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-[70px]">
        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications"
            description="You're all caught up! Check back later."
            className="mt-8"
          />
        ) : (
          <div className="rounded-xl overflow-hidden border border-[#E5E7EB] shadow-sm">
            {notifications.map((notification, index) => {
              const iconConfig = iconMap[notification.type] || iconMap.task_assigned;
              const Icon = iconConfig.icon;
              const color = iconConfig.color;
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'flex items-start gap-3 p-4 min-h-[64px] relative group transition-colors cursor-pointer',
                    notification.isRead ? 'bg-white hover:bg-[#F9FAFB]' : 'bg-[#F0F7FF] hover:bg-[#EBF5FF]',
                    index < notifications.length - 1 && 'border-b border-[#E5E7EB]'
                  )}
                >
                  {!notification.isRead && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#4A90D9]" />
                  )}

                  <div className={cn('flex-shrink-0 mt-0.5', notification.isRead ? 'ml-4' : 'ml-2', color)}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-grow">
                    <p className="text-sm font-medium text-[#1E293B] leading-snug">{notification.title}</p>
                    <p className="text-sm text-[#64748B] leading-snug mt-0.5">{notification.message}</p>
                  </div>

                  <div className="flex-shrink-0 text-xs text-[#64748B] pt-1">{formatTimestamp(notification.createdAt)}</div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </MobileShell>
  );
}
