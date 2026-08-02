const Task = require('../models/Task');
const { TASK_STATUS, TASK_STATUS_VALUES } = require('../config/constants');

const attachTaskStats = async (projects) => {
  if (projects.length === 0) return [];

  const projectIds = projects.map((project) => project._id);
  const rows = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: { project: '$project', status: '$status' }, count: { $sum: 1 } } },
  ]);

  return projects.map((project) => {
    const plain = project.toObject ? project.toObject() : project;
    const projectRows = rows.filter((row) => row._id.project.toString() === project._id.toString());
    const total = projectRows.reduce((sum, row) => sum + row.count, 0);
    const completed = projectRows.find((row) => row._id.status === TASK_STATUS.DONE)?.count || 0;
    const byStatus = TASK_STATUS_VALUES.reduce((acc, status) => {
      acc[status] = projectRows.find((row) => row._id.status === status)?.count || 0;
      return acc;
    }, {});

    return {
      ...plain,
      taskStats: {
        total,
        completed,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0,
        byStatus,
      },
    };
  });
};

module.exports = { attachTaskStats };
