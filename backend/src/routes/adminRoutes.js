const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { paginationValidator } = require('../validators/commonValidators');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: List audit logs (admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - in: query
 *         name: user
 *         schema: { type: string }
 *         description: Filter by the ID of the user who performed the action
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [create, update, delete, restore, status_change, assign, login, logout, comment, upload]
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [User, Project, Task, Comment, Attachment, Team]
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *         description: Only entries created on or after this timestamp
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *         description: Only entries created on or before this timestamp
 *     responses:
 *       200:
 *         description: Paginated list of audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs: { type: array, items: { $ref: '#/components/schemas/AuditLog' } }
 *                     pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/audit-logs', paginationValidator, adminController.listAuditLogs);

/**
 * @swagger
 * /admin/analytics:
 *   get:
 *     tags: [Admin]
 *     summary: System-wide analytics (admin only)
 *     description: Overview cards plus chart data — users by role, projects/tasks by status, 6-month user growth and task completion trends, and top contributors.
 *     responses:
 *       200:
 *         description: Analytics cards and charts
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: Analytics fetched
 *               data:
 *                 cards:
 *                   totalUsers: 24
 *                   activeUsers: 21
 *                   totalProjects: 9
 *                   activeProjects: 6
 *                   totalTasks: 143
 *                   completedTasks: 88
 *                   overdueTasks: 5
 *                   totalTeams: 3
 *                 charts:
 *                   usersByRole:
 *                     - { role: admin, count: 2 }
 *                     - { role: project_manager, count: 5 }
 *                     - { role: team_member, count: 17 }
 *                   projectsByStatus:
 *                     - { status: planning, count: 1 }
 *                     - { status: active, count: 6 }
 *                     - { status: on_hold, count: 0 }
 *                     - { status: completed, count: 2 }
 *                     - { status: archived, count: 0 }
 *                   tasksByStatus:
 *                     - { status: todo, count: 20 }
 *                     - { status: in_progress, count: 15 }
 *                     - { status: in_review, count: 10 }
 *                     - { status: done, count: 88 }
 *                     - { status: cancelled, count: 10 }
 *                   monthlyUserGrowth:
 *                     - { month: "2026-02", label: Feb, count: 4 }
 *                   monthlyTaskCompletion:
 *                     - { month: "2026-02", label: Feb, completed: 30 }
 *                   topContributors:
 *                     - { userId: 65f1a2b3c4d5e6f7a8b9c0d1, name: Ada Lovelace, avatar: null, role: team_member, assigned: 12, completed: 9 }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/analytics', adminController.getAnalytics);

/**
 * @swagger
 * /admin/system-health:
 *   get:
 *     tags: [Admin]
 *     summary: Server, database, and process health (admin only)
 *     responses:
 *       200:
 *         description: System health snapshot
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: System health fetched
 *               data:
 *                 status: ok
 *                 environment: production
 *                 serverTime: "2026-02-05T12:00:00.000Z"
 *                 uptimeSeconds: 86400
 *                 node: { version: v20.11.0, platform: linux, arch: x64 }
 *                 memory: { rssMB: 120.5, heapUsedMB: 80.2, heapTotalMB: 140, systemFreeMB: 4096, systemTotalMB: 16384 }
 *                 cpu: { cores: 8, loadAverage: [0.5, 0.4, 0.3] }
 *                 database: { status: connected, name: task_manager, host: mongo }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/system-health', adminController.getSystemHealth);

/**
 * @swagger
 * /admin/roles:
 *   get:
 *     tags: [Admin]
 *     summary: Role definitions with live user counts (admin only)
 *     responses:
 *       200:
 *         description: Role overview
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: Roles fetched
 *               data:
 *                 roles:
 *                   - role: admin
 *                     label: Administrator
 *                     description: Full access to every resource, including the admin panel, user management, and system settings.
 *                     permissions:
 *                       - Manage users, roles, and teams
 *                       - View and moderate every project and task
 *                       - Access audit logs and analytics
 *                       - View system health
 *                     userCount: 2
 *                   - role: project_manager
 *                     label: Project Manager
 *                     description: Owns and manages projects, assigns members, and tracks progress on their projects.
 *                     permissions:
 *                       - Create and manage owned projects
 *                       - Assign members and reassign project ownership
 *                       - Create, assign, and update tasks
 *                       - View team performance for owned projects
 *                     userCount: 5
 *                   - role: team_member
 *                     label: Team Member
 *                     description: Works on assigned tasks within projects they are a member of.
 *                     permissions:
 *                       - View and update assigned tasks
 *                       - Comment and upload attachments
 *                       - View projects they are a member of
 *                     userCount: 17
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/roles', adminController.listRoles);

module.exports = router;
