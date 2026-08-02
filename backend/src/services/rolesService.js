const User = require('../models/User');
const { ROLES, ROLE_VALUES } = require('../config/roles');

const ROLE_DEFINITIONS = {
  [ROLES.ADMIN]: {
    label: 'Administrator',
    description:
      'Full access to every resource, including the admin panel, user management, and system settings.',
    permissions: [
      'Manage users, roles, and teams',
      'View and moderate every project and task',
      'Access audit logs and analytics',
      'View system health',
    ],
  },
  [ROLES.PROJECT_MANAGER]: {
    label: 'Project Manager',
    description: 'Owns and manages projects, assigns members, and tracks progress on their projects.',
    permissions: [
      'Create and manage owned projects',
      'Assign members and reassign project ownership',
      'Create, assign, and update tasks',
      'View team performance for owned projects',
    ],
  },
  [ROLES.TEAM_MEMBER]: {
    label: 'Team Member',
    description: 'Works on assigned tasks within projects they are a member of.',
    permissions: [
      'View and update assigned tasks',
      'Comment and upload attachments',
      'View projects they are a member of',
    ],
  },
};

const getRoleOverview = async () => {
  const rows = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);

  return ROLE_VALUES.map((role) => ({
    role,
    ...ROLE_DEFINITIONS[role],
    userCount: rows.find((row) => row._id === role)?.count || 0,
  }));
};

module.exports = { getRoleOverview };
