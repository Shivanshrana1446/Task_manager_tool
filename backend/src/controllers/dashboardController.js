const dashboardService = require('../services/dashboardService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getSummary(req.user);
  res.status(200).json(new ApiResponse(200, { summary }, 'Dashboard summary fetched'));
});

module.exports = { getSummary };
