const { body, query } = require('express-validator');
const { validate } = require('./commonValidators');

const createAttachmentValidator = [
  body('task').optional({ nullable: true }).isMongoId(),
  body('project').optional({ nullable: true }).isMongoId(),
  body('comment').optional({ nullable: true }).isMongoId(),
  body().custom((value) => {
    if (!value.task && !value.project && !value.comment) {
      throw new Error('One of task, project, or comment is required');
    }
    return true;
  }),
  validate,
];

const listAttachmentsValidator = [
  query('task').optional().isMongoId(),
  query('project').optional().isMongoId(),
  query('comment').optional().isMongoId(),
  query().custom((value) => {
    if (!value.task && !value.project && !value.comment) {
      throw new Error('One of task, project, or comment is required');
    }
    return true;
  }),
  validate,
];

module.exports = { createAttachmentValidator, listAttachmentsValidator };
