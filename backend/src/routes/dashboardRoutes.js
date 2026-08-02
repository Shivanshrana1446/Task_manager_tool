const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get an aggregated dashboard summary for the current user
 *     description: >
 *       Admins receive org-wide metrics (total users/projects/tasks, task status
 *       breakdown, recent activity across all users). Everyone else receives a
 *       personal summary scoped to their own projects and assigned tasks.
 *     responses:
 *       200:
 *         description: Dashboard summary
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               statusCode: 200
 *               message: Dashboard summary fetched
 *               data:
 *                 summary:
 *                   scope: member
 *                   cards:
 *                     totalProjects: 4
 *                     activeProjects: 3
 *                     completedProjects: 1
 *                     pendingTasks: 6
 *                     completedTasks: 12
 *                     overdueTasks: 1
 *                     todaysDeadlines: 2
 *                   charts:
 *                     taskStatus:
 *                       - { status: todo, count: 3 }
 *                       - { status: in_progress, count: 2 }
 *                       - { status: in_review, count: 1 }
 *                       - { status: done, count: 12 }
 *                       - { status: cancelled, count: 0 }
 *                     projectProgress:
 *                       - { projectId: 65f2b3c4d5e6f7a8b9c0d1e2, name: Apollo Launch, totalTasks: 8, completedTasks: 3, progress: 38 }
 *                     monthlyProductivity:
 *                       - { month: "2026-02", label: Feb, completed: 5 }
 *                     teamPerformance: []
 *                   feeds:
 *                     recentActivity: []
 *                     upcomingDeadlines: []
 *                     recentComments: []
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/summary', dashboardController.getSummary);

module.exports = router;
