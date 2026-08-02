const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { mongoIdParam, paginationValidator } = require('../validators/commonValidators');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List the current user's notifications
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortParam'
 *       - in: query
 *         name: isRead
 *         schema: { type: boolean }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications: { type: array, items: { $ref: '#/components/schemas/Notification' } }
 *                     pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', paginationValidator, notificationController.listNotifications);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get the current user's unread notification count
 *     responses:
 *       200:
 *         description: Unread count
 *         content:
 *           application/json:
 *             example: { success: true, statusCode: 200, message: Unread count fetched, data: { count: 4 } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all of the current user's notifications as read
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             example: { success: true, statusCode: 200, message: All notifications marked as read, data: null }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/read-all', notificationController.markAllAsRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a single notification as read
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { notification: { $ref: '#/components/schemas/Notification' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Not found, or it belongs to a different user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { success: false, message: Notification not found, errors: [] }
 */
router.patch('/:id/read', mongoIdParam('id'), notificationController.markAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Dismiss (soft-delete) a notification
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification dismissed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Not found, or it belongs to a different user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { success: false, message: Notification not found, errors: [] }
 */
router.delete('/:id', mongoIdParam('id'), notificationController.deleteNotification);

module.exports = router;
