import { NavLink, Outlet } from 'react-router-dom';
import { Users, Shield, FolderKanban, UsersRound, ScrollText, BarChart3, Activity } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin', label: 'Analytics', icon: BarChart3, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/roles', label: 'Roles', icon: Shield },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/teams', label: 'Teams', icon: UsersRound },
  { to: '/admin/audit-logs', label: 'Audit logs', icon: ScrollText },
  { to: '/admin/system-health', label: 'System health', icon: Activity },
];

const AdminLayout = () => (
  <div className="mx-auto flex max-w-7xl flex-col gap-6">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Panel</h1>
      <p className="mt-1 text-sm text-foreground/50">
        Manage users, roles, projects, and teams, and monitor the system.
      </p>
    </div>

    <div className="flex flex-col gap-6 md:flex-row">
      <nav className="flex shrink-0 gap-1 overflow-x-auto pb-1 md:w-52 md:flex-col md:overflow-visible md:pb-0">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-foreground/60 hover:bg-surface hover:text-foreground'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  </div>
);

export default AdminLayout;
