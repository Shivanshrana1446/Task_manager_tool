const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Team = require('../models/Team');
const { ROLE_VALUES } = require('../config/roles');
const {
  PROJECT_STATUS,
  PROJECT_STATUS_VALUES,
  TASK_STATUS,
  TASK_STATUS_VALUES,
} = require('../config/constants');

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const sixMonthsAgo = () => {
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  return since;
};

const lastSixMonths = () => {
  const months = [];
  const cursor = new Date();
  cursor.setDate(1);
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MONTH_LABELS[d.getMonth()] });
  }
  return months;
};

const getCards = async () => {
  const now = new Date();

  const [totalUsers, activeUsers, totalProjects, activeProjects, totalTasks, completedTasks, overdueTasks, totalTeams] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Project.countDocuments(),
      Project.countDocuments({ status: PROJECT_STATUS.ACTIVE }),
      Task.countDocuments(),
      Task.countDocuments({ status: TASK_STATUS.DONE }),
      Task.countDocuments({
        dueDate: { $lt: now },
        status: { $nin: [TASK_STATUS.DONE, TASK_STATUS.CANCELLED] },
      }),
      Team.countDocuments(),
    ]);

  return {
    totalUsers,
    activeUsers,
    totalProjects,
    activeProjects,
    totalTasks,
    completedTasks,
    overdueTasks,
    totalTeams,
  };
};

const getUsersByRole = async () => {
  const rows = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
  return ROLE_VALUES.map((role) => ({ role, count: rows.find((row) => row._id === role)?.count || 0 }));
};

const getProjectsByStatus = async () => {
  const rows = await Project.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  return PROJECT_STATUS_VALUES.map((status) => ({
    status,
    count: rows.find((row) => row._id === status)?.count || 0,
  }));
};

const getTasksByStatus = async () => {
  const rows = await Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  return TASK_STATUS_VALUES.map((status) => ({
    status,
    count: rows.find((row) => row._id === status)?.count || 0,
  }));
};

const getMonthlyUserGrowth = async () => {
  const rows = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo() } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
  ]);

  return lastSixMonths().map(({ key, label }) => ({
    month: key,
    label,
    count: rows.find((row) => row._id === key)?.count || 0,
  }));
};

const getMonthlyTaskCompletion = async () => {
  const rows = await Task.aggregate([
    { $match: { status: TASK_STATUS.DONE, completedAt: { $gte: sixMonthsAgo() } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$completedAt' } }, count: { $sum: 1 } } },
  ]);

  return lastSixMonths().map(({ key, label }) => ({
    month: key,
    label,
    completed: rows.find((row) => row._id === key)?.count || 0,
  }));
};

const getTopContributors = async () => {
  const rows = await Task.aggregate([
    { $unwind: '$assignees' },
    {
      $group: {
        _id: '$assignees',
        assigned: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', TASK_STATUS.DONE] }, 1, 0] } },
      },
    },
    { $sort: { completed: -1, assigned: -1 } },
    { $limit: 8 },
  ]);

  if (rows.length === 0) return [];

  const users = await User.find({ _id: { $in: rows.map((row) => row._id) } }).select('name avatar role');

  return rows.map((row) => {
    const user = users.find((u) => u._id.toString() === row._id.toString());
    return {
      userId: row._id.toString(),
      name: user?.name || 'Unknown',
      avatar: user?.avatar?.url || null,
      role: user?.role || null,
      assigned: row.assigned,
      completed: row.completed,
    };
  });
};

const getAnalytics = async () => {
  const [cards, usersByRole, projectsByStatus, tasksByStatus, monthlyUserGrowth, monthlyTaskCompletion, topContributors] =
    await Promise.all([
      getCards(),
      getUsersByRole(),
      getProjectsByStatus(),
      getTasksByStatus(),
      getMonthlyUserGrowth(),
      getMonthlyTaskCompletion(),
      getTopContributors(),
    ]);

  return {
    cards,
    charts: {
      usersByRole,
      projectsByStatus,
      tasksByStatus,
      monthlyUserGrowth,
      monthlyTaskCompletion,
      topContributors,
    },
  };
};

module.exports = { getAnalytics };
