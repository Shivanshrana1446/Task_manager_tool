import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Check, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import {
  useInfiniteNotificationsList,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from '../hooks/useNotifications';
import { useInfiniteScrollSentinel } from '../hooks/useInfiniteScrollSentinel';
import { formatRelativeTime } from '../utils/formatters';

const TABS = [
  { key: '', label: 'All' },
  { key: 'false', label: 'Unread' },
];

const DEFAULT_FILTERS = { isRead: '', sort: '-createdAt' };

const Notifications = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const queryParams = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined)
  );
  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteNotificationsList(queryParams);
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.pages.flatMap((page) => page.notifications) || [];

  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), {
    enabled: Boolean(hasNextPage) && !isFetchingNextPage,
  });

  const setTab = (key) => setFilters((prev) => ({ ...prev, isRead: key }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-foreground/50">
            Everything that&apos;s happened across your projects and tasks.
          </p>
        </div>
        <Button
          variant="secondary"
          className="w-auto px-4"
          onClick={() => markAllAsRead.mutate()}
          isLoading={markAllAsRead.isPending}
        >
          <Check size={16} />
          Mark all as read
        </Button>
      </div>

      <div className="sticky top-14 z-20 flex gap-1 rounded-lg border border-border bg-surface p-1 shadow-soft">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filters.isRead === tab.key
                ? 'bg-primary-600 text-white'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          message={filters.isRead === 'false' ? "You're all caught up." : "You'll see updates here as they happen."}
        />
      ) : (
        <>
          <motion.ul
            layout
            className="flex flex-col gap-3"
            style={{ opacity: isFetching && !isFetchingNextPage ? 0.6 : 1 }}
          >
            <AnimatePresence mode="popLayout">
              {notifications.map((notification) => (
                <motion.li
                  key={notification._id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-soft"
                >
                  <button
                    type="button"
                    onClick={() => !notification.isRead && markAsRead.mutate(notification._id)}
                    className="flex flex-1 items-start gap-3 text-left"
                  >
                    <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400">
                      <Bell size={16} />
                      {!notification.isRead && (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary-500 ring-2 ring-surface" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={
                          notification.isRead
                            ? 'text-sm text-foreground/70'
                            : 'text-sm font-semibold text-foreground'
                        }
                      >
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-sm text-foreground/50">{notification.message}</p>
                      <p className="mt-1 text-xs text-foreground/35">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteNotification.mutate(notification._id)}
                    aria-label="Dismiss notification"
                    className="shrink-0 rounded-lg p-1.5 text-foreground/30 transition-colors hover:bg-red-500/10 hover:text-red-500"
                  >
                    <X size={15} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>

          <div ref={sentinelRef} className="flex justify-center py-4">
            {isFetchingNextPage && <Spinner size={20} />}
          </div>
        </>
      )}
    </div>
  );
};

export default Notifications;
