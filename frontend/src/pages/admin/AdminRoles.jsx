import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Check } from 'lucide-react';
import Skeleton from '../../components/ui/Skeleton';
import { useRolesOverview } from '../../hooks/useAdmin';

const AdminRoles = () => {
  const { data: roles, isLoading } = useRolesOverview();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Roles &amp; permissions</h2>
        <p className="mt-1 text-sm text-foreground/50">
          What each role can do across the system. Change a person&apos;s role from the Users page.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.role}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400">
                  <Shield size={18} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums text-foreground">{role.userCount}</p>
                  <p className="text-xs text-foreground/40">user{role.userCount === 1 ? '' : 's'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">{role.label}</h3>
                <p className="mt-1 text-xs text-foreground/50">{role.description}</p>
              </div>

              <ul className="flex flex-1 flex-col gap-1.5">
                {role.permissions.map((permission) => (
                  <li key={permission} className="flex items-start gap-2 text-xs text-foreground/60">
                    <Check size={13} className="mt-0.5 shrink-0 text-primary-600 dark:text-primary-400" />
                    {permission}
                  </li>
                ))}
              </ul>

              <Link
                to={`/admin/users?role=${role.role}`}
                className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
              >
                View users
                <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRoles;
