const { body } = require('express-validator');
const { validate } = require('./commonValidators');
const { PROJECT_STATUS_VALUES, PRIORITY_VALUES } = require('../config/constants');

const createProjectValidator = [
  body('name').trim().isLength({ min: 3, max: 150 }).withMessage('Name must be 3-150 characters'),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('status').optional().isIn(PROJECT_STATUS_VALUES),
  body('priority').optional().isIn(PRIORITY_VALUES),
  body('startDate').optional({ nullable: true }).isISO8601().toDate(),
  body('dueDate').optional({ nullable: true }).isISO8601().toDate(),
  body('members').optional().isArray().withMessage('members must be an array of user IDs'),
  body('members.*').optional().isMongoId(),
  validate,
];

const updateProjectValidator = [
  body('name').optional().trim().isLength({ min: 3, max: 150 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('status').optional().isIn(PROJECT_STATUS_VALUES),
  body('priority').optional().isIn(PRIORITY_VALUES),
  body('startDate').optional({ nullable: true }).isISO8601().toDate(),
  body('dueDate').optional({ nullable: true }).isISO8601().toDate(),
  validate,
];

const membersValidator = [
  body('members')
    .isArray({ min: 1 })
    .withMessage('members must be a non-empty array of user IDs'),
  body('members.*').isMongoId().withMessage('Each member must be a valid user ID'),
  validate,
];

const assignManagerValidator = [
  body('owner').isMongoId().withMessage('owner must be a valid user ID'),
  validate,
];

module.exports = {
  createProjectValidator,
  updateProjectValidator,
  membersValidator,
  assignManagerValidator,
};
