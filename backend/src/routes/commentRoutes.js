const express = require('express');
const commentController = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');
const {
  requireTaskProjectMemberFromBody,
  requireTaskProjectMemberFromQuery,
} = require('../middleware/taskAccess');
const { loadComment, requireCommentProjectMember, requireCommentAuthor } = require('../middleware/commentAccess');
const { mongoIdParam, paginationValidator } = require('../validators/commonValidators');
const {
  createCommentValidator,
  updateCommentValidator,
  listCommentsValidator,
} = require('../validators/commentValidators');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /comments:
 *   post:
 *     tags: [Comments]
 *     summary: Add a comment to a task
 *     description: >
 *       Notifies the task's reporter and assignees, plus anyone listed in `mentions`.
 *       Requires membership in the task's project.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content, task]
 *             properties:
 *               content: { type: string, minLength: 1, maxLength: 3000 }
 *               task: { type: string }
 *               parentComment: { type: string, nullable: true, description: For threaded replies }
 *               mentions: { type: array, items: { type: string } }
 *           example:
 *             content: Looks good to me — cc @grace
 *             task: 65f3c4d5e6f7a8b9c0d1e2f3
 *             mentions: ["65f1a2b3c4d5e6f7a8b9c0d2"]
 *     responses:
 *       201:
 *         description: Comment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { comment: { $ref: '#/components/schemas/Comment' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not a member of the task's project
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { success: false, message: You do not have access to this task, errors: [] }
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   get:
 *     tags: [Comments]
 *     summary: List comments for a task
 *     parameters:
 *       - in: query
 *         name: task
 *         required: true
 *         schema: { type: string }
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *     responses:
 *       200:
 *         description: Paginated list of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     comments: { type: array, items: { $ref: '#/components/schemas/Comment' } }
 *                     pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/',
  createCommentValidator,
  requireTaskProjectMemberFromBody,
  commentController.createComment
);
router.get(
  '/',
  listCommentsValidator,
  paginationValidator,
  requireTaskProjectMemberFromQuery,
  commentController.listComments
);

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     tags: [Comments]
 *     summary: Get a comment by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Comment found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { comment: { $ref: '#/components/schemas/Comment' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Comments]
 *     summary: Edit a comment (author only)
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
 *             required: [content]
 *             properties:
 *               content: { type: string, minLength: 1, maxLength: 3000 }
 *           example:
 *             content: Edited comment
 *     responses:
 *       200:
 *         description: Comment updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { comment: { $ref: '#/components/schemas/Comment' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only the comment's author (or an admin) can edit it
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { success: false, message: Only the comment author can perform this action, errors: [] }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   delete:
 *     tags: [Comments]
 *     summary: Soft-delete a comment (author/admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Comment deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', mongoIdParam('id'), loadComment, requireCommentProjectMember, commentController.getComment);
router.patch(
  '/:id',
  mongoIdParam('id'),
  updateCommentValidator,
  loadComment,
  requireCommentAuthor,
  commentController.updateComment
);
router.delete(
  '/:id',
  mongoIdParam('id'),
  loadComment,
  requireCommentAuthor,
  commentController.deleteComment
);

module.exports = router;
