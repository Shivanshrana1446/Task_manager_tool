const mongoose = require('mongoose');
const { TASK_STATUS, TASK_STATUS_VALUES, PRIORITY, PRIORITY_VALUES } = require('../config/constants');
const softDeletePlugin = require('./plugins/softDelete');

const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [20000, 'Description cannot exceed 20000 characters'],
      default: '',
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Task must belong to a project'],
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must have a reporter'],
    },
    assignees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    parentTask: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    status: {
      type: String,
      enum: TASK_STATUS_VALUES,
      default: TASK_STATUS.TODO,
    },
    priority: {
      type: String,
      enum: PRIORITY_VALUES,
      default: PRIORITY.MEDIUM,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 40,
      },
    ],
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
    estimatedHours: {
      type: Number,
      min: [0, 'Estimated hours cannot be negative'],
      default: null,
    },
    actualHours: {
      type: Number,
      min: [0, 'Actual hours cannot be negative'],
      default: 0,
    },
    position: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    checklist: [
      {
        text: {
          type: String,
          trim: true,
          required: true,
          maxlength: [200, 'Checklist item cannot exceed 200 characters'],
        },
        isDone: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

taskSchema.plugin(softDeletePlugin);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ project: 1, position: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ reporter: 1 });
taskSchema.index({ parentTask: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ status: 1, completedAt: 1 });
taskSchema.index({ title: 'text', description: 'text' });

taskSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'task',
});

taskSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'task',
  count: true,
});

taskSchema.virtual('attachments', {
  ref: 'Attachment',
  localField: '_id',
  foreignField: 'task',
});

taskSchema.virtual('subtasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'parentTask',
});

taskSchema.virtual('isOverdue').get(function getIsOverdue() {
  if (!this.dueDate) return false;
  return this.dueDate.getTime() < Date.now() && this.status !== TASK_STATUS.DONE;
});

module.exports = mongoose.model('Task', taskSchema);
