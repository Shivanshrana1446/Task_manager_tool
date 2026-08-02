const mongoose = require('mongoose');
const { NOTIFICATION_TYPE_VALUES, ENTITY_TYPE_VALUES } = require('../config/constants');
const softDeletePlugin = require('./plugins/softDelete');

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have a recipient'],
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: NOTIFICATION_TYPE_VALUES,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    entityType: {
      type: String,
      enum: ENTITY_TYPE_VALUES,
      default: null,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      refPath: 'entityType',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

notificationSchema.plugin(softDeletePlugin);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ entityType: 1, entityId: 1 });

notificationSchema.pre('validate', function requireEntityIdWithType(next) {
  if (this.entityType && !this.entityId) {
    this.invalidate('entityId', 'entityId is required when entityType is set');
  }
  next();
});

notificationSchema.virtual('entity', {
  refPath: 'entityType',
  localField: 'entityId',
  foreignField: '_id',
  justOne: true,
});

notificationSchema.methods.markAsRead = function markAsRead() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
