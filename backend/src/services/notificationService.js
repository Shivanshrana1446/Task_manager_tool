const Notification = require('../models/Notification');
const logger = require('../config/logger');
const { emitToUser } = require('../socket');

const createNotification = async ({ recipient, sender, type, title, message, entityType, entityId }) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender: sender || null,
      type,
      title,
      message,
      entityType: entityType || null,
      entityId: entityId || null,
    });

    emitToUser(recipient, 'notification:new', notification.toJSON());
    return notification;
  } catch (err) {
    logger.error(`Failed to create notification: ${err.message}`, { stack: err.stack });
    return null;
  }
};

const notifyMany = async (recipientIds, payload) => {
  const uniqueRecipients = [...new Set(recipientIds.map((id) => id.toString()))].filter(
    (id) => id !== payload.sender?.toString()
  );

  return Promise.all(
    uniqueRecipients.map((recipient) => createNotification({ ...payload, recipient }))
  );
};

module.exports = { createNotification, notifyMany };
