const env = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const fromMongooseValidation = (err) => {
  const errors = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  return new ApiError(422, 'Validation failed', errors, err.stack);
};

const fromCastError = (err) =>
  new ApiError(400, `Invalid value for '${err.path}': ${err.value}`, [], err.stack);

const fromDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue?.[field];
  return new ApiError(409, `${field} '${value}' is already in use`, [], err.stack);
};

const MULTER_ERROR_MESSAGES = {
  LIMIT_FILE_SIZE: 'File is too large',
  LIMIT_FILE_COUNT: 'Too many files',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
  LIMIT_PART_COUNT: 'Too many form parts',
  LIMIT_FIELD_KEY: 'Field name is too long',
  LIMIT_FIELD_VALUE: 'Field value is too long',
  LIMIT_FIELD_COUNT: 'Too many fields',
};

const fromMulterError = (err) =>
  new ApiError(400, MULTER_ERROR_MESSAGES[err.code] || 'File upload failed', [], err.stack);

const normalizeError = (err) => {
  if (err instanceof ApiError) return err;
  if (err.name === 'ValidationError' && err.errors) return fromMongooseValidation(err);
  if (err.name === 'CastError') return fromCastError(err);
  if (err.code === 11000) return fromDuplicateKey(err);
  if (err.name === 'MulterError') return fromMulterError(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return new ApiError(statusCode, message, err.errors || [], err.stack);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const error = normalizeError(err);

  logger.error(`${req.method} ${req.originalUrl} - ${error.message}`, {
    stack: error.stack,
  });

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors,
    stack: env.nodeEnv === 'development' ? error.stack : undefined,
  });
};

module.exports = errorHandler;
