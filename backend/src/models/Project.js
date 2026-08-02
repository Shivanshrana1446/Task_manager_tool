const mongoose = require('mongoose');
const { PROJECT_STATUS, PROJECT_STATUS_VALUES, PRIORITY, PRIORITY_VALUES } = require('../config/constants');
const softDeletePlugin = require('./plugins/softDelete');

const { Schema } = mongoose;

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [3, 'Project name must be at least 3 characters'],
      maxlength: [150, 'Project name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required'],
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: PROJECT_STATUS_VALUES,
      default: PROJECT_STATUS.PLANNING,
    },
    priority: {
      type: String,
      enum: PRIORITY_VALUES,
      default: PRIORITY.MEDIUM,
    },
    startDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
      validate: {
        validator: function validateDueDate(value) {
          if (!value || !this.startDate) return true;
          return value >= this.startDate;
        },
        message: 'Due date must be on or after the start date',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

projectSchema.plugin(softDeletePlugin);

projectSchema.index({ owner: 1, isDeleted: 1 });
projectSchema.index({ members: 1 });
projectSchema.index({ status: 1, dueDate: 1 });
projectSchema.index({ name: 'text', description: 'text' });

projectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
});

projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true,
});

projectSchema.virtual('attachments', {
  ref: 'Attachment',
  localField: '_id',
  foreignField: 'project',
});

projectSchema.virtual('durationDays').get(function getDurationDays() {
  if (!this.startDate || !this.dueDate) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((this.dueDate.getTime() - this.startDate.getTime()) / msPerDay);
});

projectSchema.methods.isMember = function isMember(userId) {
  const target = userId.toString();
  return (
    this.owner.toString() === target || this.members.some((member) => member.toString() === target)
  );
};

module.exports = mongoose.model('Project', projectSchema);
