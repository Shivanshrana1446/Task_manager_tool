const express = require('express');
const taskController = require('../controllers/taskController');
const { authenticate, authorize } = require('../middleware/auth');
const { requireProjectMemberFromBody } = require('../middleware/projectAccess');
const {
  loadTask,
  requireTaskProjectMember,
  requireTaskWriteAccess,
  requireTaskManageAccess,
} = require('../middleware/taskAccess');
const { mongoIdParam, paginationValidator } = require('../validators/commonValidators');
const {
  createTaskValidator,
  updateTaskValidator,
  bulkUpdateStatusValidator,
  bulkDeleteValidator,
} = require('../validators/taskValidators');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task
 *     description: The authenticated user becomes the task's `reporter`. Requires membership in the target project.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, project]
 *             properties:
 *               title: { type: string, minLength: 2, maxLength: 200 }
 *               project: { type: string }
 *               description: { type: string, maxLength: 20000 }
 *               assignees: { type: array, items: { type: string } }
 *               parentTask: { type: string, nullable: true }
 *               status: { type: string, enum: [todo, in_progress, in_review, testing, done, cancelled], default: todo }
 *               priority: { type: string, enum: [low, medium, high, critical], default: medium }
 *               tags: { type: array, items: { type: string } }
 *               startDate: { type: string, format: date-time, nullable: true }
 *               dueDate: { type: string, format: date-time, nullable: true }
 *               estimatedHours: { type: number, minimum: 0 }
 *           example:
 *             title: Design landing page
 *             project: 65f2b3c4d5e6f7a8b9c0d1e2
 *             description: First-pass hero + pricing sections
 *             assignees: ["65f1a2b3c4d5e6f7a8b9c0d2"]
 *             priority: high
 *             tags: [frontend, design]
 *             dueDate: "2026-02-10T00:00:00.000Z"
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { task: { $ref: '#/components/schemas/Task' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not a member of the target project
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { success: false, message: You do not have access to this project, errors: [] }
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks visible to the current user
 *     description: >
 *       Admins see every task. Everyone else sees only tasks belonging to projects they
 *       own or are a member of; filtering by `project` on a project you can't access
 *       returns 403 rather than an empty list.
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - in: query
 *         name: project
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in_progress, in_review, testing, done, cancelled] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high, critical] }
 *       - in: query
 *         name: assignee
 *         schema: { type: string }
 *       - in: query
 *         name: reporter
 *         schema: { type: string }
 *       - in: query
 *         name: parentTask
 *         schema: { type: string }
 *       - in: query
 *         name: tag
 *         schema: { type: string }
 *       - in: query
 *         name: dueBefore
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: dueAfter
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Paginated list of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks: { type: array, items: { $ref: '#/components/schemas/Task' } }
 *                     pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Filtered by a project you do not have access to
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { success: false, message: You do not have access to this project, errors: [] }
 */
router.post(
  '/',
  createTaskValidator,
  requireProjectMemberFromBody,
  taskController.createTask
);
router.get('/', paginationValidator, taskController.listTasks);

/**
 * @swagger
 * /tasks/bulk:
 *   patch:
 *     tags: [Tasks]
 *     summary: Bulk-update the status of multiple tasks
 *     description: >
 *       Applies only to tasks the caller has write access to (assignee, reporter,
 *       project owner, or admin) — the rest are silently skipped and reflected in
 *       `skippedCount` rather than failing the whole request.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids, status]
 *             properties:
 *               ids: { type: array, items: { type: string } }
 *               status: { type: string, enum: [todo, in_progress, in_review, testing, done, cancelled] }
 *           example:
 *             ids: ["65f2b3c4d5e6f7a8b9c0d1e2", "65f2b3c4d5e6f7a8b9c0d1e3"]
 *             status: in_review
 *     responses:
 *       200:
 *         description: Bulk update summary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   delete:
 *     tags: [Tasks]
 *     summary: Bulk soft-delete multiple tasks
 *     description: >
 *       Applies only to tasks the caller can manage (project owner or admin) —
 *       the rest are silently skipped and reflected in `skippedCount`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Bulk delete summary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch('/bulk', bulkUpdateStatusValidator, taskController.bulkUpdateTasks);
router.delete('/bulk', bulkDeleteValidator, taskController.bulkDeleteTasks);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a task by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { task: { $ref: '#/components/schemas/Task' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Tasks]
 *     summary: Update a task (assignee, reporter, project owner, or admin)
 *     description: >
 *       Changing `status` records a `status_change` audit entry and notifies the
 *       reporter and assignees; adding new `assignees` notifies them.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, minLength: 2, maxLength: 200 }
 *               description: { type: string, maxLength: 20000 }
 *               status: { type: string, enum: [todo, in_progress, in_review, testing, done, cancelled] }
 *               priority: { type: string, enum: [low, medium, high, critical] }
 *               assignees: { type: array, items: { type: string } }
 *               tags: { type: array, items: { type: string } }
 *               startDate: { type: string, format: date-time, nullable: true }
 *               dueDate: { type: string, format: date-time, nullable: true }
 *               estimatedHours: { type: number, minimum: 0 }
 *               actualHours: { type: number, minimum: 0 }
 *               position: { type: number }
 *           example:
 *             status: done
 *     responses:
 *       200:
 *         description: Task updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { task: { $ref: '#/components/schemas/Task' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not the assignee, reporter, project owner, or an admin
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { success: false, message: You do not have permission to modify this task, errors: [] }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   delete:
 *     tags: [Tasks]
 *     summary: Soft-delete a task (project owner/admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', mongoIdParam('id'), loadTask, requireTaskProjectMember, taskController.getTask);
router.patch(
  '/:id',
  mongoIdParam('id'),
  updateTaskValidator,
  loadTask,
  requireTaskWriteAccess,
  taskController.updateTask
);
router.delete(
  '/:id',
  mongoIdParam('id'),
  loadTask,
  requireTaskManageAccess,
  taskController.deleteTask
);

/**
 * @swagger
 * /tasks/{id}/history:
 *   get:
 *     tags: [Tasks]
 *     summary: Get the audit history for a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Chronological list of audit log entries for this task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     history: { type: array, items: { $ref: '#/components/schemas/AuditLog' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id/history',
  mongoIdParam('id'),
  loadTask,
  requireTaskProjectMember,
  taskController.getTaskHistory
);

/**
 * @swagger
 * /tasks/{id}/restore:
 *   post:
 *     tags: [Tasks]
 *     summary: Restore a soft-deleted task (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task restored
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/restore', authorize(ROLES.ADMIN), mongoIdParam('id'), taskController.restoreTask);

module.exports = router;
