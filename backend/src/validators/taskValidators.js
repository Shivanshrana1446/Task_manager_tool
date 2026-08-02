const { body } = require('express-validator');
const { validate } = require('./commonValidators');
const { TASK_STATUS_VALUES, PRIORITY_VALUES } = require('../config/constants');

const createTaskValidator = [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
  body('project').isMongoId().withMessage('A valid project ID is required'),
  body('description').optional().trim().isLength({ max: 20000 }),
  body('assignees').optional().isArray(),
  body('assignees.*').optional().isMongoId(),
  body('parentTask').optional({ nullable: true }).isMongoId(),
  body('status').optional().isIn(TASK_STATUS_VALUES),
  body('priority').optional().isIn(PRIORITY_VALUES),
  body('tags').optional().isArray(),
  body('startDate').optional({ nullable: true }).isISO8601().toDate(),
  body('dueDate').optional({ nullable: true }).isISO8601().toDate(),
  body('estimatedHours').optional({ nullable: true }).isFloat({ min: 0 }),
  body('checklist').optional().isArray(),
  body('checklist.*.text').optional().trim().isLength({ min: 1, max: 200 }),
  body('checklist.*.isDone').optional().isBoolean(),
  validate,
];

const updateTaskValidator = [
  body('title').optional().trim().isLength({ min: 2, max: 200 }),
  body('description').optional().trim().isLength({ max: 20000 }),
  body('assignees').optional().isArray(),
  body('assignees.*').optional().isMongoId(),
  body('parentTask').optional({ nullable: true }).isMongoId(),
  body('status').optional().isIn(TASK_STATUS_VALUES),
  body('priority').optional().isIn(PRIORITY_VALUES),
  body('tags').optional().isArray(),
  body('startDate').optional({ nullable: true }).isISO8601().toDate(),
  body('dueDate').optional({ nullable: true }).isISO8601().toDate(),
  body('estimatedHours').optional({ nullable: true }).isFloat({ min: 0 }),
  body('actualHours').optional({ nullable: true }).isFloat({ min: 0 }),
  body('position').optional().isFloat(),
  body('checklist').optional().isArray(),
  body('checklist.*.text').optional().trim().isLength({ min: 1, max: 200 }),
  body('checklist.*.isDone').optional().isBoolean(),
  validate,
];

const bulkUpdateStatusValidator = [
  body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array'),
  body('ids.*').isMongoId(),
  body('status').isIn(TASK_STATUS_VALUES),
  validate,
];

const bulkDeleteValidator = [
  body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array'),
  body('ids.*').isMongoId(),
  validate,
];

module.exports = {
  createTaskValidator,
  updateTaskValidator,
  bulkUpdateStatusValidator,
  bulkDeleteValidator,
};
