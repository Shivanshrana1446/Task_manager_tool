const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { avatarUpload } = require('../middleware/upload');
const { mongoIdParam, paginationValidator } = require('../validators/commonValidators');
const {
  updateMeValidator,
  changePasswordValidator,
  updateRoleValidator,
  updateStatusValidator,
} = require('../validators/userValidators');
const { ROLES } = require('../config/roles');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List users
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [admin, project_manager, team_member] }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     users: { type: array, items: { $ref: '#/components/schemas/User' } }
 *                     pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', paginationValidator, userController.listUsers);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update the current user's profile
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 100 }
 *           example:
 *             name: Ada L. Byron
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { user: { $ref: '#/components/schemas/User' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch('/me', updateMeValidator, userController.updateMe);

/**
 * @swagger
 * /users/me/password:
 *   patch:
 *     tags: [Users]
 *     summary: Change the current user's password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password, minLength: 8 }
 *           example:
 *             currentPassword: StrongPass1
 *             newPassword: NewStrongPass1
 *     responses:
 *       200:
 *         description: Password changed
 *         content:
 *           application/json:
 *             example: { success: true, statusCode: 200, message: Password changed successfully, data: null }
 *       401:
 *         description: Not authenticated, or the current password is incorrect
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { success: false, message: Current password is incorrect, errors: [] }
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch('/me/password', changePasswordValidator, userController.changePassword);

/**
 * @swagger
 * /users/me/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload/replace the current user's avatar
 *     description: Max 2MB, image files only. Replacing an existing avatar deletes the previous asset.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Avatar updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { user: { $ref: '#/components/schemas/User' } }
 *       400:
 *         description: Missing file, non-image file, or the file exceeds 2MB
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             examples:
 *               missing:
 *                 summary: No file attached
 *                 value: { success: false, message: An image file is required, errors: [] }
 *               tooLarge:
 *                 summary: File exceeds the 2MB limit
 *                 value: { success: false, message: File is too large, errors: [] }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/me/avatar', avatarUpload.single('avatar'), userController.updateAvatar);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { user: { $ref: '#/components/schemas/User' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', mongoIdParam('id'), userController.getUser);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Change a user's role (admin only)
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
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [admin, project_manager, team_member] }
 *           example:
 *             role: project_manager
 *     responses:
 *       200:
 *         description: Role updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { user: { $ref: '#/components/schemas/User' } }
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
  '/:id/role',
  authorize(ROLES.ADMIN),
  mongoIdParam('id'),
  updateRoleValidator,
  userController.updateRole
);

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     tags: [Users]
 *     summary: Activate or deactivate a user (admin only)
 *     description: A deactivated user's existing sessions keep working until their access token expires, but they can no longer log in.
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
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *           example:
 *             isActive: false
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { user: { $ref: '#/components/schemas/User' } }
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
  '/:id/status',
  authorize(ROLES.ADMIN),
  mongoIdParam('id'),
  updateStatusValidator,
  userController.updateStatus
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Soft-delete a user (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authorize(ROLES.ADMIN), mongoIdParam('id'), userController.deleteUser);

/**
 * @swagger
 * /users/{id}/restore:
 *   post:
 *     tags: [Users]
 *     summary: Restore a soft-deleted user (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User restored
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/:id/restore',
  authorize(ROLES.ADMIN),
  mongoIdParam('id'),
  userController.restoreUser
);

module.exports = router;
