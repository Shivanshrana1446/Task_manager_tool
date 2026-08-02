const Team = require('../models/Team');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const loadTeam = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.id);
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }
  req.team = team;
  next();
});

module.exports = { loadTeam };
