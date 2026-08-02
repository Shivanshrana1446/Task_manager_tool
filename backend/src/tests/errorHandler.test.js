const errorHandler = require('../middleware/errorHandler');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const env = require('../config/env');

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const req = { method: 'GET', originalUrl: '/api/v1/widgets' };

describe('errorHandler middleware', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes an ApiError through unchanged', () => {
    const res = buildRes();
    const err = new ApiError(403, 'Forbidden', [{ field: 'x', message: 'nope' }]);

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Forbidden', errors: [{ field: 'x', message: 'nope' }] })
    );
  });

  it('converts a Mongoose ValidationError into a 422', () => {
    const res = buildRes();
    const err = {
      name: 'ValidationError',
      errors: {
        name: { path: 'name', message: 'Name is required' },
        email: { path: 'email', message: 'Email is invalid' },
      },
    };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Validation failed',
        errors: [
          { field: 'name', message: 'Name is required' },
          { field: 'email', message: 'Email is invalid' },
        ],
      })
    );
  });

  it('converts a Mongoose CastError into a 400', () => {
    const res = buildRes();
    const err = { name: 'CastError', path: '_id', value: 'not-an-id' };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid value for '_id': not-an-id" })
    );
  });

  it('converts a duplicate key error into a 409', () => {
    const res = buildRes();
    const err = { code: 11000, keyValue: { email: 'dup@example.com' } };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "email 'dup@example.com' is already in use" })
    );
  });

  it('falls back to a generic field name for a duplicate key error with no keyValue', () => {
    const res = buildRes();
    const err = { code: 11000 };

    errorHandler(err, req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "field 'undefined' is already in use" })
    );
  });

  it('maps a known MulterError code to a friendly message', () => {
    const res = buildRes();
    const err = { name: 'MulterError', code: 'LIMIT_FILE_SIZE' };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'File is too large' }));
  });

  it('falls back to a generic message for an unknown MulterError code', () => {
    const res = buildRes();
    const err = { name: 'MulterError', code: 'SOMETHING_NEW' };

    errorHandler(err, req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'File upload failed' }));
  });

  it('defaults an unrecognized error to a 500 with its own message', () => {
    const res = buildRes();
    const err = new Error('Something exploded');

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Something exploded' }));
  });

  it('falls back to a generic message and 500 status when the error has neither', () => {
    const res = buildRes();
    const err = {};

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Internal Server Error' }));
  });

  it('respects a custom statusCode on a plain error object', () => {
    const res = buildRes();
    const err = { statusCode: 418, message: "I'm a teapot" };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(418);
  });

  it('omits the stack trace outside of development', () => {
    const res = buildRes();
    expect(env.nodeEnv).not.toBe('development');

    errorHandler(new Error('boom'), req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ stack: undefined }));
  });
});
