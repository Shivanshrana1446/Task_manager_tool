const mongoose = require('mongoose');
const { AUDIT_ACTION_VALUES, ENTITY_TYPE_VALUES } = require('../config/constants');
const softDeletePlugin = require('./plugins/softDelete');

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      enum: AUDIT_ACTION_VALUES,
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: ENTITY_TYPE_VALUES,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Entity ID is required'],
      refPath: 'entityType',
    },
    before: {
      type: Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

auditLogSchema.plugin(softDeletePlugin);

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });

auditLogSchema.virtual('entity', {
  refPath: 'entityType',
  localField: 'entityId',
  foreignField: '_id',
  justOne: true,
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
