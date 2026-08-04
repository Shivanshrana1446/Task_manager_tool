import { useSelector } from 'react-redux';

const ROLE_STYLES = {
  Owner: 'bg-primary-500/10 text-primary-600 dark:text-primary-400',
  'Project Manager': 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  Member: 'bg-surface text-foreground/60 ring-1 ring-border',
};

// The current user's relationship to this specific project — distinct from
// their org-wide role, since a project_manager who isn't this project's
// owner still manages every task in it (see taskAccess.js's canWriteTask).
export const getMyProjectRole = (project, currentUser) => {
  if (!currentUser || !project) return null;
  if (project.owner?._id === currentUser._id) return 'Owner';

  const isMember = project.members?.some((member) => member._id === currentUser._id);
  if (!isMember) return null;

  return currentUser.role === 'project_manager' ? 'Project Manager' : 'Member';
};

const MyRoleBadge = ({ project, className = '' }) => {
  const currentUser = useSelector((state) => state.auth.user);
  const role = getMyProjectRole(project, currentUser);

  if (!role) return null;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${ROLE_STYLES[role]} ${className}`}
    >
      {role}
    </span>
  );
};

export default MyRoleBadge;
