const AuditLog = require('../models/AuditLog');
const { paginateQuery } = require('../utils/queryHelper');

const POPULATE = { path: 'user', select: 'name email avatar role' };

const buildFilter = (query) => {
  const filter = {};

  if (query.user) filter.user = query.user;
  if (query.action) filter.action = query.action;
  if (query.entityType) filter.entityType = query.entityType;

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  return filter;
};

const listAuditLogs = (query) =>
  paginateQuery({
    Model: AuditLog,
    filter: buildFilter(query),
    query,
    defaultSort: '-createdAt',
    populate: POPULATE,
  });

module.exports = { listAuditLogs };
