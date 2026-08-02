const Task = require('../models/Task');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const { paginateQuery, pickFilter } = require('../utils/queryHelper');
const { ROLES } = require('../config/roles');
const { TASK_STATUS } = require('../config/constants');
const { canWriteTask, canManageTask } = require('../middleware/taskAccess');

const TASK_POPULATE = [
  { path: 'assignees', select: 'name email avatar' },
  { path: 'reporter', select: 'name email avatar' },
];

const populateTask = (task) => task.populate(TASK_POPULATE);

const createTask = (reporterId, data) =>
  Task.create({
    title: data.title,
    description: data.description,
    project: data.project,
    reporter: reporterId,
    assignees: data.assignees || [],
    parentTask: data.parentTask || null,
    status: data.status,
    priority: data.priority,
    tags: data.tags,
    startDate: data.startDate,
    dueDate: data.dueDate,
    estimatedHours: data.estimatedHours,
    checklist: data.checklist || [],
    completedAt: data.status === TASK_STATUS.DONE ? new Date() : null,
  });

const listTasks = async (user, query) => {
  const filter = pickFilter(query, ['project', 'status', 'priority', 'reporter', 'parentTask']);

  if (query.assignee) filter.assignees = query.assignee;
  if (query.tag) filter.tags = query.tag;
  if (query.dueBefore || query.dueAfter) {
    filter.dueDate = {};
    if (query.dueBefore) filter.dueDate.$lte = new Date(query.dueBefore);
    if (query.dueAfter) filter.dueDate.$gte = new Date(query.dueAfter);
  }

  if (user.role !== ROLES.ADMIN) {
    const accessibleProjectIds = (
      await Project.find({ $or: [{ owner: user.id }, { members: user.id }] }).select('_id')
    ).map((p) => p._id.toString());

    if (filter.project) {
      if (!accessibleProjectIds.includes(filter.project)) {
        throw new ApiError(403, 'You do not have access to this project');
      }
    } else {
      filter.project = { $in: accessibleProjectIds };
    }
  }

  return paginateQuery({
    Model: Task,
    filter,
    query,
    searchFields: ['title', 'description'],
    defaultSort: '-createdAt',
    populate: TASK_POPULATE,
  });
};

const UPDATABLE_FIELDS = [
  'title',
  'description',
  'status',
  'priority',
  'tags',
  'startDate',
  'dueDate',
  'estimatedHours',
  'actualHours',
  'position',
  'parentTask',
  'checklist',
];

const updateTask = async (task, data) => {
  const previousStatus = task.status;
  const previousAssignees = task.assignees.map((assignee) => assignee.toString());

  UPDATABLE_FIELDS.forEach((field) => {
    if (data[field] !== undefined) {
      task[field] = data[field];
    }
  });

  let newAssignees = [];
  if (data.assignees !== undefined) {
    task.assignees = data.assignees;
    newAssignees = data.assignees.filter((id) => !previousAssignees.includes(id.toString()));
  }

  const statusChanged = data.status !== undefined && data.status !== previousStatus;
  if (statusChanged) {
    task.completedAt = data.status === TASK_STATUS.DONE ? new Date() : null;
  }

  await task.save();

  return {
    task,
    statusChanged,
    previousStatus,
    newAssignees,
  };
};

const softDeleteTask = (task) => task.softDelete();

// Loads every requested task (with its project, for permission checks) and splits
// them into ones the user is allowed to act on vs. ones that get silently skipped,
// rather than failing the whole batch over one task the user can't touch.
const loadBulkTasks = async (ids) => Task.find({ _id: { $in: ids } }).populate('project');

const bulkUpdateStatus = async (user, ids, status) => {
  const tasks = await loadBulkTasks(ids);
  const allowed = tasks.filter((task) => canWriteTask(user, task));

  await Task.updateMany(
    { _id: { $in: allowed.map((task) => task._id) } },
    { status, completedAt: status === TASK_STATUS.DONE ? new Date() : null }
  );

  return {
    updatedCount: allowed.length,
    skippedCount: tasks.length - allowed.length,
    updatedIds: allowed.map((task) => task._id.toString()),
  };
};

const bulkDeleteTasks = async (user, ids) => {
  const tasks = await loadBulkTasks(ids);
  const allowed = tasks.filter((task) => canManageTask(user, task));

  await Promise.all(allowed.map((task) => task.softDelete()));

  return {
    deletedCount: allowed.length,
    skippedCount: tasks.length - allowed.length,
    deletedIds: allowed.map((task) => task._id.toString()),
  };
};

const restoreTask = async (taskId) => {
  const task = await Task.findById(taskId).withDeleted();
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  await task.restore();
  return task;
};

module.exports = {
  createTask,
  listTasks,
  updateTask,
  softDeleteTask,
  restoreTask,
  populateTask,
  bulkUpdateStatus,
  bulkDeleteTasks,
};
