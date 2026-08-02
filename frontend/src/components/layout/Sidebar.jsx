import { NavLink, Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Bell,
  ShieldCheck,
  ChevronsLeft,
  ChevronsRight,
  Search,
  UserCircle,
  LogOut,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import DropdownMenu from '../ui/DropdownMenu';
import { useLogout } from '../../hooks/useAuthMutations';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/notifications', label: 'Notifications', icon: Bell, badge: 'unread' },
];

const Sidebar = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  user,
  unreadCount,
  onOpenPalette,
}) => {
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  const items = user?.role === 'admin'
    ? [...NAV_ITEMS, { to: '/admin', label: 'Admin', icon: ShieldCheck }]
    : NAV_ITEMS;

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/login', { replace: true });
  };

  const renderContent = (collapsed, variant = 'desktop') => (
    <>
      <div className={`flex items-center gap-2 px-4 py-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <Link to="/" className="text-lg font-bold tracking-tight text-foreground">
            Task Manager
          </Link>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground/50 transition-colors hover:bg-primary-50 hover:text-foreground dark:hover:bg-primary-950 md:flex"
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      <button
        type="button"
        onClick={onOpenPalette}
        aria-label="Open command palette"
        className={`mx-3 mb-3 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground/50 transition-colors hover:border-primary-300 hover:text-foreground dark:hover:border-primary-700 ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <Search size={15} className="shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">Search...</span>
            <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
          </>
        )}
      </button>

      <nav className="flex-1 space-y-0.5 px-3">
        {items.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onCloseMobile}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'text-primary-700 dark:text-primary-300' : 'text-foreground/60 hover:text-foreground'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && variant === 'desktop' && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-primary-50 dark:bg-primary-950"
                  />
                )}
                {isActive && variant === 'mobile' && (
                  <span className="absolute inset-0 rounded-lg bg-primary-50 dark:bg-primary-950" />
                )}
                <Icon size={18} className="relative z-10 shrink-0" />
                {!collapsed && <span className="relative z-10 flex-1 truncate">{label}</span>}
                {badge === 'unread' && unreadCount > 0 && (
                  <span
                    className={`relative z-10 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white ${
                      collapsed ? 'absolute right-1.5 top-1.5' : ''
                    }`}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="border-t border-border p-3">
          <DropdownMenu
            align="start"
            triggerClassName="w-full"
            trigger={
              <span
                title={collapsed ? user.name : undefined}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-primary-50 dark:hover:bg-primary-950 ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <Avatar name={user.name} src={user.avatar?.url} size="sm" />
                {!collapsed && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{user.name}</span>
                    <span className="block truncate text-xs capitalize text-foreground/40">
                      {user.role?.replace('_', ' ')}
                    </span>
                  </span>
                )}
              </span>
            }
            items={[
              { key: 'profile', label: 'Profile', icon: <UserCircle size={15} />, onClick: () => navigate('/profile') },
              { key: 'divider', divider: true },
              { key: 'logout', label: 'Log out', icon: <LogOut size={15} />, onClick: handleLogout, danger: true },
            ]}
          />
        </div>
      )}
    </>
  );

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 240 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface md:flex"
      >
        {renderContent(isCollapsed, 'desktop')}
      </motion.aside>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface shadow-floating md:hidden"
            >
              {renderContent(false, 'mobile')}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
