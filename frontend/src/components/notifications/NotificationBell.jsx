import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import {
  useNotificationsList,
  useUnreadCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '../../hooks/useNotifications';
import { formatRelativeTime } from '../../utils/formatters';
import Spinner from '../ui/Spinner';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data, isLoading } = useNotificationsList({ limit: 8, sort: '-createdAt' });
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const notifications = data?.notifications || [];

  const openPanel = () => {
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + window.scrollY + 8, right: window.innerWidth - rect.right });
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClick = (event) => {
      if (
        !triggerRef.current?.contains(event.target) &&
        !panelRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openPanel())}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-primary-50 hover:text-foreground dark:hover:bg-primary-950"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ring-2 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              style={{ position: 'absolute', top: position.top, right: position.right }}
              className="z-50 flex max-h-[28rem] w-96 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllAsRead.mutate()}
                    className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
                  >
                    <Check size={12} />
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size={18} />
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-foreground/40">
                    You&apos;re all caught up.
                  </p>
                ) : (
                  <ul>
                    {notifications.map((notification) => (
                      <li key={notification._id}>
                        <button
                          type="button"
                          onClick={() =>
                            !notification.isRead && markAsRead.mutate(notification._id)
                          }
                          className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-primary-50 dark:hover:bg-primary-950"
                        >
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                              notification.isRead ? 'bg-transparent' : 'bg-primary-500'
                            }`}
                          />
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
                            <p className="truncate text-xs text-foreground/50">
                              {notification.message}
                            </p>
                            <p className="mt-0.5 text-[11px] text-foreground/35">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="border-t border-border px-4 py-2.5 text-center text-xs font-medium text-primary-600 hover:underline"
              >
                View all notifications
              </Link>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default NotificationBell;
