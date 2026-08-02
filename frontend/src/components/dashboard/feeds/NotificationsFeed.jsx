import { Bell } from 'lucide-react';
import FeedCard from '../FeedCard';
import { useNotificationsList, useMarkNotificationAsRead } from '../../../hooks/useNotifications';
import { formatRelativeTime } from '../../../utils/formatters';

const NotificationsFeed = () => {
  const { data, isLoading } = useNotificationsList({ limit: 5, sort: '-createdAt' });
  const markAsRead = useMarkNotificationAsRead();
  const notifications = data?.notifications;

  return (
    <FeedCard
      title="Notifications"
      isLoading={isLoading}
      isEmpty={!notifications?.length}
      emptyMessage="You're all caught up."
    >
      {notifications?.map((notification) => (
        <li key={notification._id}>
          <button
            type="button"
            onClick={() => !notification.isRead && markAsRead.mutate(notification._id)}
            className="flex w-full items-start gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-primary-50 dark:hover:bg-primary-950"
          >
            <div className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface ring-1 ring-border">
              <Bell size={14} className="text-foreground/50" />
              {!notification.isRead && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary-500 ring-2 ring-surface" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={
                  notification.isRead
                    ? 'text-sm text-foreground/70'
                    : 'text-sm font-medium text-foreground'
                }
              >
                {notification.title}
              </p>
              <p className="truncate text-xs text-foreground/40">{notification.message}</p>
              <p className="text-xs text-foreground/40">{formatRelativeTime(notification.createdAt)}</p>
            </div>
          </button>
        </li>
      ))}
    </FeedCard>
  );
};

export default NotificationsFeed;
