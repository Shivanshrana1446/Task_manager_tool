const { param, query, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(
      422,
      'Validation failed',
      errors.array().map((err) => ({ field: err.path, message: err.msg }))
    );
  }
  next();
};

const mongoIdParam = (name = 'id') => [
  param(name).isMongoId().withMessage(`${name} must be a valid ID`),
  validate,
];

const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
  validate,
];

module.exports = { validate, mongoIdParam, paginationValidator };
