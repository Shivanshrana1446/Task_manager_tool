const express = require('express');
const { param } = require('express-validator');
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');
const { loadProject, requireProjectMember, requireProjectOwner } = require('../middleware/projectAccess');
const { mongoIdParam, paginationValidator, validate } = require('../validators/commonValidators');
const {
  createProjectValidator,
  updateProjectValidator,
  membersValidator,
  assignManagerValidator,
} = require('../validators/projectValidators');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a project
 *     description: The authenticated user becomes the project's `owner`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 3, maxLength: 150 }
 *               description: { type: string, maxLength: 2000 }
 *               status: { type: string, enum: [planning, active, on_hold, completed, archived], default: planning }
 *               priority: { type: string, enum: [low, medium, high, critical], default: medium }
 *               startDate: { type: string, format: date-time, nullable: true }
 *               dueDate: { type: string, format: date-time, nullable: true }
 *               members: { type: array, items: { type: string }, description: Array of user IDs }
 *           example:
 *             name: Apollo Launch
 *             description: Send the rocket up
 *             status: planning
 *             priority: high
 *             startDate: "2026-01-01T00:00:00.000Z"
 *             dueDate: "2026-12-01T00:00:00.000Z"
 *     responses:
 *       201:
 *         description: Project created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { project: { $ref: '#/components/schemas/Project' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   get:
 *     tags: [Projects]
 *     summary: List projects visible to the current user
 *     description: >
 *       Admins see every project. Everyone else sees only projects they own or are a
 *       member of. Each project includes a `taskStats` summary (total/completed/progress).
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [planning, active, on_hold, completed, archived] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high, critical] }
 *     responses:
 *       200:
 *         description: Paginated list of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     projects: { type: array, items: { $ref: '#/components/schemas/Project' } }
 *                     pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', createProjectValidator, projectController.createProject);
router.get('/', paginationValidator, projectController.listProjects);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get a project by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { project: { $ref: '#/components/schemas/Project' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not a member of this project
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { success: false, message: You do not have access to this project, errors: [] }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Projects]
 *     summary: Update a project (owner/admin only)
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
 *               name: { type: string, minLength: 3, maxLength: 150 }
 *               description: { type: string, maxLength: 2000 }
 *               status: { type: string, enum: [planning, active, on_hold, completed, archived] }
 *               priority: { type: string, enum: [low, medium, high, critical] }
 *               startDate: { type: string, format: date-time, nullable: true }
 *               dueDate: { type: string, format: date-time, nullable: true }
 *           example:
 *             status: active
 *             description: Updated scope after kickoff
 *     responses:
 *       200:
 *         description: Project updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { project: { $ref: '#/components/schemas/Project' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only the project owner (or an admin) can update this project
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { success: false, message: Only the project owner can perform this action, errors: [] }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   delete:
 *     tags: [Projects]
 *     summary: Soft-delete a project (owner/admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project deleted
 *         content:
 *           application/json:
 *             example: { success: true, statusCode: 200, message: Project deleted, data: { project: {} } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', mongoIdParam('id'), loadProject, requireProjectMember, projectController.getProject);
router.patch(
  '/:id',
  mongoIdParam('id'),
  updateProjectValidator,
  loadProject,
  requireProjectOwner,
  projectController.updateProject
);
router.delete(
  '/:id',
  mongoIdParam('id'),
  loadProject,
  requireProjectOwner,
  projectController.deleteProject
);

/**
 * @swagger
 * /projects/{id}/restore:
 *   post:
 *     tags: [Projects]
 *     summary: Restore a soft-deleted project
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project restored
 *         content:
 *           application/json:
 *             example: { success: true, statusCode: 200, message: Project restored, data: { project: {} } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/restore', mongoIdParam('id'), projectController.restoreProject);

/**
 * @swagger
 * /projects/{id}/members:
 *   post:
 *     tags: [Projects]
 *     summary: Add members to a project (owner/admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [members]
 *             properties:
 *               members: { type: array, items: { type: string }, minItems: 1 }
 *           example:
 *             members: ["65f1a2b3c4d5e6f7a8b9c0d2"]
 *     responses:
 *       200:
 *         description: Members added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { project: { $ref: '#/components/schemas/Project' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/:id/members',
  mongoIdParam('id'),
  membersValidator,
  loadProject,
  requireProjectOwner,
  projectController.addMembers
);

/**
 * @swagger
 * /projects/{id}/members/{userId}:
 *   delete:
 *     tags: [Projects]
 *     summary: Remove a member from a project (owner/admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Member removed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  '/:id/members/:userId',
  param('id').isMongoId(),
  param('userId').isMongoId(),
  validate,
  loadProject,
  requireProjectOwner,
  projectController.removeMember
);

/**
 * @swagger
 * /projects/{id}/manager:
 *   patch:
 *     tags: [Projects]
 *     summary: Reassign the project manager (owner/admin only)
 *     description: >
 *       The previous owner is automatically kept on as a regular member (unless they
 *       were already in `members`). Reassigning to the current owner is a no-op.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [owner]
 *             properties:
 *               owner: { type: string, description: User ID of the new project manager }
 *           example:
 *             owner: 65f1a2b3c4d5e6f7a8b9c0d2
 *     responses:
 *       200:
 *         description: Project manager updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { project: { $ref: '#/components/schemas/Project' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch(
  '/:id/manager',
  mongoIdParam('id'),
  assignManagerValidator,
  loadProject,
  requireProjectOwner,
  projectController.assignManager
);

module.exports = router;
