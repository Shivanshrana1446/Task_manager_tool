const taskService = require('../services/taskService');
const { recordAudit, getEntityHistory } = require('../services/auditService');
const { notifyMany } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { AUDIT_ACTIONS, ENTITY_TYPES, NOTIFICATION_TYPES } = require('../config/constants');

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user.id, req.body);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.CREATE,
    entityType: ENTITY_TYPES.TASK,
    entityId: task._id,
    after: task.toObject(),
  });

  if (task.assignees.length > 0) {
    await notifyMany(task.assignees, {
      sender: req.user.id,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      title: 'New task assigned',
      message: `You were assigned to "${task.title}"`,
      entityType: ENTITY_TYPES.TASK,
      entityId: task._id,
    });
  }

  await taskService.populateTask(task);
  res.status(201).json(new ApiResponse(201, { task }, 'Task created'));
});

const listTasks = asyncHandler(async (req, res) => {
  const { data, pagination } = await taskService.listTasks(req.user, req.query);
  res.status(200).json(new ApiResponse(200, { tasks: data, pagination }, 'Tasks fetched'));
});

const getTask = asyncHandler(async (req, res) => {
  await taskService.populateTask(req.task);
  res.status(200).json(new ApiResponse(200, { task: req.task }, 'Task fetched'));
});

const updateTask = asyncHandler(async (req, res) => {
  const before = req.task.toObject();
  const { task, statusChanged, previousStatus, newAssignees } = await taskService.updateTask(
    req.task,
    req.body
  );

  await recordAudit({
    req,
    action: statusChanged ? AUDIT_ACTIONS.STATUS_CHANGE : AUDIT_ACTIONS.UPDATE,
    entityType: ENTITY_TYPES.TASK,
    entityId: task._id,
    before,
    after: task.toObject(),
  });

  if (statusChanged) {
    // The project owner sees progress even on tasks they didn't create or
    // aren't assigned to — notifyMany dedupes, so no double-notify if they
    // happen to also be the reporter/an assignee.
    const recipients = [task.reporter, ...task.assignees, task.project.owner];
    await notifyMany(recipients, {
      sender: req.user.id,
      type:
        task.status === 'done' ? NOTIFICATION_TYPES.TASK_COMPLETED : NOTIFICATION_TYPES.TASK_UPDATED,
      title: 'Task status updated',
      message: `"${task.title}" changed from ${previousStatus} to ${task.status}`,
      entityType: ENTITY_TYPES.TASK,
      entityId: task._id,
    });
  }

  if (newAssignees.length > 0) {
    await notifyMany(newAssignees, {
      sender: req.user.id,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      title: 'New task assigned',
      message: `You were assigned to "${task.title}"`,
      entityType: ENTITY_TYPES.TASK,
      entityId: task._id,
    });
  }

  await taskService.populateTask(task);
  res.status(200).json(new ApiResponse(200, { task }, 'Task updated'));
});

const deleteTask = asyncHandler(async (req, res) => {
  await taskService.softDeleteTask(req.task);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.DELETE,
    entityType: ENTITY_TYPES.TASK,
    entityId: req.task._id,
  });

  res.status(200).json(new ApiResponse(200, { task: req.task }, 'Task deleted'));
});

const restoreTask = asyncHandler(async (req, res) => {
  const task = await taskService.restoreTask(req.params.id);

  await recordAudit({
    req,
    action: AUDIT_ACTIONS.RESTORE,
    entityType: ENTITY_TYPES.TASK,
    entityId: task._id,
  });

  res.status(200).json(new ApiResponse(200, { task }, 'Task restored'));
});

const getTaskHistory = asyncHandler(async (req, res) => {
  const history = await getEntityHistory(ENTITY_TYPES.TASK, req.task._id);
  res.status(200).json(new ApiResponse(200, { history }, 'Task history fetched'));
});

const bulkUpdateTasks = asyncHandler(async (req, res) => {
  const { ids, status } = req.body;
  const result = await taskService.bulkUpdateStatus(req.user, ids, status);

  await Promise.all(
    result.updatedIds.map((entityId) =>
      recordAudit({
        req,
        action: AUDIT_ACTIONS.STATUS_CHANGE,
        entityType: ENTITY_TYPES.TASK,
        entityId,
        after: { status },
        metadata: { bulk: true },
      })
    )
  );

  res.status(200).json(new ApiResponse(200, result, 'Tasks updated'));
});

const bulkDeleteTasks = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  const result = await taskService.bulkDeleteTasks(req.user, ids);

  await Promise.all(
    result.deletedIds.map((entityId) =>
      recordAudit({
        req,
        action: AUDIT_ACTIONS.DELETE,
        entityType: ENTITY_TYPES.TASK,
        entityId,
        metadata: { bulk: true },
      })
    )
  );

  res.status(200).json(new ApiResponse(200, result, 'Tasks deleted'));
});

module.exports = {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
  restoreTask,
  getTaskHistory,
  bulkUpdateTasks,
  bulkDeleteTasks,
};
