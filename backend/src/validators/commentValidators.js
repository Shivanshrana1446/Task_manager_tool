const { body, query } = require('express-validator');
const { validate } = require('./commonValidators');

const createCommentValidator = [
  body('content').trim().isLength({ min: 1, max: 3000 }).withMessage('Comment cannot be empty'),
  body('task').isMongoId().withMessage('A valid task ID is required'),
  body('parentComment').optional({ nullable: true }).isMongoId(),
  body('mentions').optional().isArray(),
  body('mentions.*').optional().isMongoId(),
  validate,
];

const updateCommentValidator = [
  body('content').trim().isLength({ min: 1, max: 3000 }).withMessage('Comment cannot be empty'),
  validate,
];

const listCommentsValidator = [
  query('task').isMongoId().withMessage('A valid task ID is required'),
  validate,
];

module.exports = { createCommentValidator, updateCommentValidator, listCommentsValidator };
