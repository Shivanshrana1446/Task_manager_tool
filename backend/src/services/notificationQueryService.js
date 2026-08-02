const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { paginateQuery, pickFilter } = require('../utils/queryHelper');
const { emitToUser } = require('../socket');

const listNotifications = (userId, query) =>
  paginateQuery({
    Model: Notification,
    filter: { recipient: userId, ...pickFilter(query, ['isRead', 'type']) },
    query,
    defaultSort: '-createdAt',
  });

const unreadCount = (userId) => Notification.countDocuments({ recipient: userId, isRead: false });

const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({ _id: notificationId, recipient: userId });
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }
  await notification.markAsRead();
  emitToUser(userId, 'notification:read', { id: notification._id.toString() });
  return notification;
};

const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  emitToUser(userId, 'notification:read-all', {});
  return result;
};

const softDeleteNotification = async (userId, notificationId) => {
  const notification = await Notification.findOne({ _id: notificationId, recipient: userId });
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }
  await notification.softDelete();
  return notification;
};

module.exports = {
  listNotifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  softDeleteNotification,
};
