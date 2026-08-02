const express = require('express');
const attachmentController = require('../controllers/attachmentController');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  loadAttachment,
  requireAttachmentProjectMember,
  requireAttachmentOwner,
  requireAttachmentAccessFromBody,
  requireAttachmentAccessFromQuery,
} = require('../middleware/attachmentAccess');
const { mongoIdParam, paginationValidator } = require('../validators/commonValidators');
const {
  createAttachmentValidator,
  listAttachmentsValidator,
} = require('../validators/attachmentValidators');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /attachments:
 *   post:
 *     tags: [Attachments]
 *     summary: Upload a file attached to a task, project, or comment
 *     description: >
 *       Exactly one of `task`, `project`, or `comment` must be provided. Max 10MB;
 *       allowed types: JPEG/PNG/GIF/WebP images, PDF, Word/Excel documents, plain
 *       text, CSV, and ZIP.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary }
 *               task: { type: string }
 *               project: { type: string }
 *               comment: { type: string }
 *     responses:
 *       201:
 *         description: File uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { attachment: { $ref: '#/components/schemas/Attachment' } }
 *       400:
 *         description: No parent reference given, unsupported file type, or file too large
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             examples:
 *               noParent:
 *                 summary: None of task/project/comment provided
 *                 value: { success: false, message: One of task, project, or comment is required, errors: [] }
 *               tooLarge:
 *                 summary: File exceeds the 10MB limit
 *                 value: { success: false, message: File is too large, errors: [] }
 *               badType:
 *                 summary: Unsupported MIME type
 *                 value: { success: false, message: Unsupported file type, errors: [] }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   get:
 *     tags: [Attachments]
 *     summary: List attachments for a task, project, or comment
 *     parameters:
 *       - in: query
 *         name: task
 *         schema: { type: string }
 *       - in: query
 *         name: project
 *         schema: { type: string }
 *       - in: query
 *         name: comment
 *         schema: { type: string }
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Paginated list of attachments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     attachments: { type: array, items: { $ref: '#/components/schemas/Attachment' } }
 *                     pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/',
  upload.single('file'),
  createAttachmentValidator,
  requireAttachmentAccessFromBody,
  attachmentController.createAttachment
);
router.get(
  '/',
  listAttachmentsValidator,
  paginationValidator,
  requireAttachmentAccessFromQuery,
  attachmentController.listAttachments
);

/**
 * @swagger
 * /attachments/{id}:
 *   get:
 *     tags: [Attachments]
 *     summary: Get an attachment by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attachment found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties: { attachment: { $ref: '#/components/schemas/Attachment' } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Attachments]
 *     summary: Soft-delete an attachment (uploader/admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Attachment deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id',
  mongoIdParam('id'),
  loadAttachment,
  requireAttachmentProjectMember,
  attachmentController.getAttachment
);
router.delete(
  '/:id',
  mongoIdParam('id'),
  loadAttachment,
  requireAttachmentOwner,
  attachmentController.deleteAttachment
);

module.exports = router;
