const { body } = require('express-validator');
const { validate } = require('./commonValidators');

const createTeamValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Team name must be 2-100 characters'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('lead').isMongoId().withMessage('lead must be a valid user ID'),
  body('members').optional().isArray().withMessage('members must be an array'),
  body('members.*').optional().isMongoId().withMessage('Each member must be a valid user ID'),
  validate,
];

const updateTeamValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  validate,
];

const membersValidator = [
  body('members').isArray({ min: 1 }).withMessage('members must be a non-empty array'),
  body('members.*').isMongoId().withMessage('Each member must be a valid user ID'),
  validate,
];

const assignLeadValidator = [
  body('lead').isMongoId().withMessage('lead must be a valid user ID'),
  validate,
];

module.exports = {
  createTeamValidator,
  updateTeamValidator,
  membersValidator,
  assignLeadValidator,
};
