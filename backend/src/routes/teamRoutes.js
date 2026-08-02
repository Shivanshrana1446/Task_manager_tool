const express = require('express');
const { param } = require('express-validator');
const teamController = require('../controllers/teamController');
const { authenticate, authorize } = require('../middleware/auth');
const { loadTeam } = require('../middleware/teamAccess');
const { mongoIdParam, paginationValidator, validate } = require('../validators/commonValidators');
const {
  createTeamValidator,
  updateTeamValidator,
  membersValidator,
  assignLeadValidator,
} = require('../validators/teamValidators');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));

/**
 * @swagger
 * /teams:
 *   post:
 *     tags: [Teams]
 *     summary: Create a team (admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, lead]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 100 }
 *               description: { type: string, maxLength: 500 }
 *               lead: { type: string, description: User ID of the team lead }
 *               members: { type: array, items: { type: string } }
 *           example:
 *             name: Platform Engineering
 *             description: Owns core infra and developer tooling
 *             lead: 65f1a2b3c4d5e6f7a8b9c0d1
 *             members: ["65f1a2b3c4d5e6f7a8b9c0d2"]
 *     responses:
 *       201:
 *         description: Team created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { team: { $ref: '#/components/schemas/Team' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   get:
 *     tags: [Teams]
 *     summary: List teams (admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *     responses:
 *       200:
 *         description: Paginated list of teams
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     teams: { type: array, items: { $ref: '#/components/schemas/Team' } }
 *                     pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', createTeamValidator, teamController.createTeam);
router.get('/', paginationValidator, teamController.listTeams);

/**
 * @swagger
 * /teams/{id}:
 *   get:
 *     tags: [Teams]
 *     summary: Get a team by ID (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Team found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { team: { $ref: '#/components/schemas/Team' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Teams]
 *     summary: Update a team (admin only)
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
 *               name: { type: string, minLength: 2, maxLength: 100 }
 *               description: { type: string, maxLength: 500 }
 *           example:
 *             name: Platform & Infra
 *     responses:
 *       200:
 *         description: Team updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { team: { $ref: '#/components/schemas/Team' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   delete:
 *     tags: [Teams]
 *     summary: Soft-delete a team (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Team deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', mongoIdParam('id'), loadTeam, teamController.getTeam);
router.patch('/:id', mongoIdParam('id'), updateTeamValidator, loadTeam, teamController.updateTeam);
router.delete('/:id', mongoIdParam('id'), loadTeam, teamController.deleteTeam);

/**
 * @swagger
 * /teams/{id}/restore:
 *   post:
 *     tags: [Teams]
 *     summary: Restore a soft-deleted team (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Team restored
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/restore', mongoIdParam('id'), teamController.restoreTeam);

/**
 * @swagger
 * /teams/{id}/members:
 *   post:
 *     tags: [Teams]
 *     summary: Add members to a team (admin only)
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
 *             members: ["65f1a2b3c4d5e6f7a8b9c0d3"]
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
 *                   properties: { team: { $ref: '#/components/schemas/Team' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/:id/members', mongoIdParam('id'), membersValidator, loadTeam, teamController.addMembers);

/**
 * @swagger
 * /teams/{id}/members/{userId}:
 *   delete:
 *     tags: [Teams]
 *     summary: Remove a member from a team (admin only)
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
  loadTeam,
  teamController.removeMember
);

/**
 * @swagger
 * /teams/{id}/lead:
 *   patch:
 *     tags: [Teams]
 *     summary: Reassign the team lead (admin only)
 *     description: The previous lead is automatically kept on as a regular member. Reassigning to the current lead is a no-op.
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
 *             required: [lead]
 *             properties:
 *               lead: { type: string }
 *           example:
 *             lead: 65f1a2b3c4d5e6f7a8b9c0d3
 *     responses:
 *       200:
 *         description: Team lead updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { team: { $ref: '#/components/schemas/Team' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch('/:id/lead', mongoIdParam('id'), assignLeadValidator, loadTeam, teamController.assignLead);

module.exports = router;
