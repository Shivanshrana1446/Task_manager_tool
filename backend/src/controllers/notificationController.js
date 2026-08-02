const notificationQueryService = require('../services/notificationQueryService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const listNotifications = asyncHandler(async (req, res) => {
  const { data, pagination } = await notificationQueryService.listNotifications(
    req.user.id,
    req.query
  );
  res
    .status(200)
    .json(new ApiResponse(200, { notifications: data, pagination }, 'Notifications fetched'));
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationQueryService.unreadCount(req.user.id);
  res.status(200).json(new ApiResponse(200, { count }, 'Unread count fetched'));
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationQueryService.markAsRead(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, { notification }, 'Notification marked as read'));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationQueryService.markAllAsRead(req.user.id);
  res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await notificationQueryService.softDeleteNotification(
    req.user.id,
    req.params.id
  );
  res.status(200).json(new ApiResponse(200, { notification }, 'Notification dismissed'));
});

module.exports = {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
