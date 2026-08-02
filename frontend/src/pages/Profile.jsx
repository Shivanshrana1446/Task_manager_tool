import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useLogout } from '../hooks/useAuthMutations';
import { useCurrentUser } from '../hooks/useCurrentUser';

const ROLE_LABELS = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  team_member: 'Team Member',
};

const Profile = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const logoutMutation = useLogout();
  useCurrentUser();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-lg"
    >
      <Card>
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700 dark:bg-primary-900 dark:text-primary-300">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{user.name}</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/10 px-2.5 py-0.5 text-xs font-medium text-primary-600 dark:text-primary-400">
              <ShieldCheck size={12} />
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center gap-3 text-sm text-foreground/80">
            <UserIcon size={16} className="text-foreground/50" />
            <span>{user.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-foreground/80">
            <Mail size={16} className="text-foreground/50" />
            <span>{user.email}</span>
          </div>
        </div>

        <Button
          variant="secondary"
          className="mt-6"
          isLoading={logoutMutation.isPending}
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Log out
        </Button>
      </Card>
    </motion.div>
  );
};

export default Profile;
