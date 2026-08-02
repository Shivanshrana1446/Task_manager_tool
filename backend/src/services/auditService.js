const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

const recordAudit = async ({ req, action, entityType, entityId, before = null, after = null, metadata = {} }) => {
  try {
    await AuditLog.create({
      user: req?.user?.id || null,
      action,
      entityType,
      entityId,
      before,
      after,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
      metadata,
    });
  } catch (err) {
    logger.error(`Failed to record audit log: ${err.message}`, { stack: err.stack });
  }
};

const getEntityHistory = (entityType, entityId, limit = 100) =>
  AuditLog.find({ entityType, entityId })
    .sort('createdAt')
    .limit(limit)
    .populate('user', 'name avatar');

module.exports = { recordAudit, getEntityHistory };
