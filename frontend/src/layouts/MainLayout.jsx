import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Menu } from 'lucide-react';
import ThemeToggle from '../components/common/ThemeToggle';
import NotificationBell from '../components/notifications/NotificationBell';
import ToastHost from '../components/notifications/ToastHost';
import Sidebar from '../components/layout/Sidebar';
import CommandPalette from '../components/command/CommandPalette';
import KeyboardShortcutsModal from '../components/command/KeyboardShortcutsModal';
import { useNotificationSocket } from '../hooks/useNotificationSocket';
import { useUnreadCount } from '../hooks/useNotifications';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const COLLAPSE_KEY = 'sidebar-collapsed';

const MainLayout = () => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  useNotificationSocket();
  const { data: unreadCount = 0 } = useUnreadCount();

  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === 'true'
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      localStorage.setItem(COLLAPSE_KEY, String(!prev));
      return !prev;
    });
  };

  useKeyboardShortcuts(
    {
      'mod+k': () => setIsPaletteOpen(true),
      '?': () => setIsShortcutsOpen(true),
      '/': () => document.querySelector('[data-search-input]')?.focus(),
    },
    ['mod+k']
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[200] rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white focus:not-sr-only"
      >
        Skip to content
      </a>

      {user && (
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
          user={user}
          unreadCount={unreadCount}
          onOpenPalette={() => setIsPaletteOpen(true)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex items-center gap-3 border-b border-border px-4 py-3 md:px-6">
          {user && (
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-primary-50 hover:text-foreground dark:hover:bg-primary-950 md:hidden"
            >
              <Menu size={18} />
            </button>
          )}

          {!user && (
            <a
              href="/"
              className="text-base font-bold tracking-tight text-foreground"
            >
              Task Manager
            </a>
          )}

          <div className="flex-1" />

          <ThemeToggle />
          {user && <NotificationBell />}
        </header>

        <main id="main-content" className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>

        <footer className="border-t border-border px-4 py-4 text-center text-sm text-foreground/50 md:px-8">
          &copy; {new Date().getFullYear()} Task Manager
        </footer>
      </div>

      {user && (
        <>
          <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
          <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
        </>
      )}

      <ToastHost />
    </div>
  );
};

export default MainLayout;
