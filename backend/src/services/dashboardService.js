const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { ROLES } = require('../config/roles');
const { PROJECT_STATUS, TASK_STATUS, TASK_STATUS_VALUES, PRIORITY } = require('../config/constants');
const { attachTaskStats } = require('./projectStatsService');

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

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const tasksByStatusMap = (rows) =>
  TASK_STATUS_VALUES.reduce((acc, status) => {
    acc[status] = rows.find((row) => row._id === status)?.count || 0;
    return acc;
  }, {});

const getCards = async ({ projectFilter, taskFilter, userId, now }) => {
  const [
    totalProjects,
    activeProjects,
    completedProjects,
    tasksByStatusAgg,
    overdueTasks,
    todaysDeadlines,
    myTasks,
    highPriorityTasks,
  ] = await Promise.all([
    Project.countDocuments(projectFilter),
    Project.countDocuments({ ...projectFilter, status: PROJECT_STATUS.ACTIVE }),
    Project.countDocuments({ ...projectFilter, status: PROJECT_STATUS.COMPLETED }),
    Task.aggregate([{ $match: taskFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Task.countDocuments({
      ...taskFilter,
      dueDate: { $lt: now },
      status: { $nin: [TASK_STATUS.DONE, TASK_STATUS.CANCELLED] },
    }),
    Task.countDocuments({
      ...taskFilter,
      dueDate: { $gte: startOfDay(now), $lte: endOfDay(now) },
      status: { $nin: [TASK_STATUS.DONE, TASK_STATUS.CANCELLED] },
    }),
    // Personal count, independent of the admin/member scoping applied to taskFilter —
    // relevant to admins too, who otherwise only see org-wide numbers.
    Task.countDocuments({ assignees: new mongoose.Types.ObjectId(userId) }),
    Task.countDocuments({
      ...taskFilter,
      priority: { $in: [PRIORITY.HIGH, PRIORITY.CRITICAL] },
      status: { $nin: [TASK_STATUS.DONE, TASK_STATUS.CANCELLED] },
    }),
  ]);

  const tasksByStatus = tasksByStatusMap(tasksByStatusAgg);

  return {
    cards: {
      totalProjects,
      activeProjects,
      completedProjects,
      pendingTasks:
        tasksByStatus.todo +
        tasksByStatus.in_progress +
        tasksByStatus.in_review +
        tasksByStatus.testing,
      completedTasks: tasksByStatus.done,
      overdueTasks,
      todaysDeadlines,
      myTasks,
      highPriorityTasks,
    },
    tasksByStatus,
  };
};

const getProjectProgress = async (projectFilter) => {
  const projects = await Project.find(projectFilter).sort('-updatedAt').limit(5).select('name');
  if (projects.length === 0) return [];

  const withStats = await attachTaskStats(projects);

  return withStats.map((project) => ({
    projectId: project._id.toString(),
    name: project.name,
    totalTasks: project.taskStats.total,
    completedTasks: project.taskStats.completed,
    progress: project.taskStats.progress,
  }));
};

const getMonthlyProductivity = async (taskFilter) => {
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await Task.aggregate([
    { $match: { ...taskFilter, status: TASK_STATUS.DONE, completedAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$completedAt' } },
        count: { $sum: 1 },
      },
    },
  ]);

  const months = [];
  const cursor = new Date();
  cursor.setDate(1);

  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({
      month: key,
      label: MONTH_LABELS[d.getMonth()],
      completed: rows.find((row) => row._id === key)?.count || 0,
    });
  }

  return months;
};

const getTeamPerformance = async (projectFilter) => {
  let taskMatch = {};

  if (projectFilter) {
    const projectIds = (await Project.find(projectFilter).select('_id')).map((p) => p._id);
    if (projectIds.length === 0) return [];
    taskMatch = { project: { $in: projectIds } };
  }

  const rows = await Task.aggregate([
    { $match: taskMatch },
    { $unwind: '$assignees' },
    {
      $group: {
        _id: '$assignees',
        assigned: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', TASK_STATUS.DONE] }, 1, 0] } },
      },
    },
    { $sort: { assigned: -1 } },
    { $limit: 6 },
  ]);

  if (rows.length === 0) return [];

  const users = await User.find({ _id: { $in: rows.map((row) => row._id) } }).select('name avatar');

  return rows.map((row) => {
    const user = users.find((u) => u._id.toString() === row._id.toString());
    return {
      userId: row._id.toString(),
      name: user?.name || 'Unknown',
      avatar: user?.avatar?.url || null,
      assigned: row.assigned,
      completed: row.completed,
    };
  });
};

const getUpcomingDeadlines = (taskFilter) => {
  const now = new Date();
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);

  return Task.find({
    ...taskFilter,
    dueDate: { $gte: now, $lte: in7Days },
    status: { $nin: [TASK_STATUS.DONE, TASK_STATUS.CANCELLED] },
  })
    .sort('dueDate')
    .limit(6)
    .populate('project', 'name')
    .select('title dueDate priority status project');
};

const getRecentComments = async (taskFilter) => {
  const taskIds = (await Task.find(taskFilter).select('_id')).map((t) => t._id);
  if (taskIds.length === 0) return [];

  return Comment.find({ task: { $in: taskIds } })
    .sort('-createdAt')
    .limit(6)
    .populate('author', 'name avatar')
    .populate('task', 'title');
};

const getRecentActivity = (filter) =>
  AuditLog.find(filter).sort('-createdAt').limit(8).populate('user', 'name avatar');

const getSummary = async (user) => {
  const now = new Date();
  const isAdmin = user.role === ROLES.ADMIN;

  const projectFilter = isAdmin ? {} : { $or: [{ owner: user.id }, { members: user.id }] };
  const taskFilter = isAdmin ? {} : { assignees: new mongoose.Types.ObjectId(user.id) };
  const activityFilter = isAdmin ? {} : { user: user.id };

  let teamPerformanceFilter;
  if (isAdmin) {
    teamPerformanceFilter = null;
  } else if (user.role === ROLES.PROJECT_MANAGER) {
    teamPerformanceFilter = { owner: user.id };
  } else {
    teamPerformanceFilter = undefined;
  }

  const [
    { cards, tasksByStatus },
    projectProgress,
    monthlyProductivity,
    teamPerformance,
    upcomingDeadlines,
    recentComments,
    recentActivity,
  ] = await Promise.all([
    getCards({ projectFilter, taskFilter, userId: user.id, now }),
    getProjectProgress(projectFilter),
    getMonthlyProductivity(taskFilter),
    teamPerformanceFilter === undefined ? Promise.resolve([]) : getTeamPerformance(teamPerformanceFilter),
    getUpcomingDeadlines(taskFilter),
    getRecentComments(taskFilter),
    getRecentActivity(activityFilter),
  ]);

  return {
    scope: isAdmin ? 'admin' : 'member',
    cards,
    charts: {
      taskStatus: TASK_STATUS_VALUES.map((status) => ({ status, count: tasksByStatus[status] })),
      projectProgress,
      monthlyProductivity,
      teamPerformance,
    },
    feeds: {
      recentActivity,
      upcomingDeadlines,
      recentComments,
    },
  };
};

module.exports = { getSummary };
