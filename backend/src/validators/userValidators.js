const { body } = require('express-validator');
const { validate } = require('./commonValidators');
const { ROLE_VALUES } = require('../config/roles');

const updateMeValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  validate,
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
  validate,
];

const updateRoleValidator = [
  body('role').isIn(ROLE_VALUES).withMessage(`Role must be one of: ${ROLE_VALUES.join(', ')}`),
  validate,
];

const updateStatusValidator = [
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  validate,
];

module.exports = {
  updateMeValidator,
  changePasswordValidator,
  updateRoleValidator,
  updateStatusValidator,
};
