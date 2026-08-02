const auditLogService = require('../services/auditLogService');
const adminAnalyticsService = require('../services/adminAnalyticsService');
const systemHealthService = require('../services/systemHealthService');
const rolesService = require('../services/rolesService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const listAuditLogs = asyncHandler(async (req, res) => {
  const { data, pagination } = await auditLogService.listAuditLogs(req.query);
  res.status(200).json(new ApiResponse(200, { logs: data, pagination }, 'Audit logs fetched'));
});

const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await adminAnalyticsService.getAnalytics();
  res.status(200).json(new ApiResponse(200, analytics, 'Analytics fetched'));
});

const getSystemHealth = asyncHandler(async (req, res) => {
  const health = systemHealthService.getSystemHealth();
  res.status(200).json(new ApiResponse(200, health, 'System health fetched'));
});

const listRoles = asyncHandler(async (req, res) => {
  const roles = await rolesService.getRoleOverview();
  res.status(200).json(new ApiResponse(200, { roles }, 'Roles fetched'));
});

module.exports = {
  listAuditLogs,
  getAnalytics,
  getSystemHealth,
  listRoles,
};
