import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  Bell,
  UserCircle,
  BarChart3,
  Users,
  Shield,
  UsersRound,
  ScrollText,
  Activity,
  Sun,
  Moon,
  LogOut,
  Plus,
  CornerDownLeft,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useLogout } from '../../hooks/useAuthMutations';

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const { mode, toggle: toggleTheme } = useTheme();
  const logoutMutation = useLogout();

  const isAdmin = user?.role === 'admin';

  const groups = useMemo(() => {
    const navigation = [
      { id: 'nav-home', label: 'Dashboard', icon: LayoutDashboard, run: () => navigate('/') },
      { id: 'nav-projects', label: 'Projects', icon: FolderKanban, run: () => navigate('/projects') },
      { id: 'nav-notifications', label: 'Notifications', icon: Bell, run: () => navigate('/notifications') },
      { id: 'nav-profile', label: 'Profile', icon: UserCircle, run: () => navigate('/profile') },
    ];

    if (isAdmin) {
      navigation.push(
        { id: 'nav-admin-analytics', label: 'Admin — Analytics', icon: BarChart3, run: () => navigate('/admin') },
        { id: 'nav-admin-users', label: 'Admin — Users', icon: Users, run: () => navigate('/admin/users') },
        { id: 'nav-admin-roles', label: 'Admin — Roles', icon: Shield, run: () => navigate('/admin/roles') },
        { id: 'nav-admin-projects', label: 'Admin — Projects', icon: FolderKanban, run: () => navigate('/admin/projects') },
        { id: 'nav-admin-teams', label: 'Admin — Teams', icon: UsersRound, run: () => navigate('/admin/teams') },
        { id: 'nav-admin-audit', label: 'Admin — Audit Logs', icon: ScrollText, run: () => navigate('/admin/audit-logs') },
        { id: 'nav-admin-health', label: 'Admin — System Health', icon: Activity, run: () => navigate('/admin/system-health') }
      );
    }

    const actions = [
      {
        id: 'action-new-project',
        label: 'New project',
        keywords: 'create add',
        icon: Plus,
        run: () => navigate('/projects?new=1'),
      },
      {
        id: 'action-theme',
        label: mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
        keywords: 'theme appearance dark light',
        icon: mode === 'dark' ? Sun : Moon,
        run: toggleTheme,
      },
      {
        id: 'action-logout',
        label: 'Log out',
        icon: LogOut,
        run: async () => {
          await logoutMutation.mutateAsync();
          navigate('/login', { replace: true });
        },
      },
    ];

    return { Navigate: navigation, Actions: actions };
  }, [isAdmin, mode, navigate, toggleTheme, logoutMutation]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = (item) =>
      !term || item.label.toLowerCase().includes(term) || item.keywords?.includes(term);

    return Object.entries(groups).reduce((acc, [group, items]) => {
      const hits = items.filter(matches);
      if (hits.length) acc.push({ group, items: hits });
      return acc;
    }, []);
  }, [groups, query]);

  const flatItems = useMemo(() => filtered.flatMap((g) => g.items), [filtered]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const runItem = (item) => {
    if (!item) return;
    onClose();
    item.run();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runItem(flatItems[activeIndex]);
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  let renderedIndex = -1;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="glass-strong relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border shadow-floating"
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
              <Search size={18} className="shrink-0 text-foreground/40" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pages, actions..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
              />
              <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-foreground/40 sm:block">
                Esc
              </kbd>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {flatItems.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-foreground/40">
                  No matches for &quot;{query}&quot;
                </p>
              ) : (
                filtered.map(({ group, items }) => (
                  <div key={group} className="mb-1 last:mb-0">
                    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/35">
                      {group}
                    </p>
                    {items.map((item) => {
                      renderedIndex += 1;
                      const index = renderedIndex;
                      const isActive = index === activeIndex;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => runItem(item)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                            isActive
                              ? 'bg-primary-600 text-white'
                              : 'text-foreground/80 hover:bg-primary-50 dark:hover:bg-primary-950'
                          }`}
                        >
                          <Icon size={16} className="shrink-0" />
                          <span className="flex-1 truncate">{item.label}</span>
                          {isActive && <CornerDownLeft size={14} className="shrink-0 opacity-70" />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CommandPalette;
