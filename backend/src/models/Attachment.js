const mongoose = require('mongoose');
const softDeletePlugin = require('./plugins/softDelete');

const { Schema } = mongoose;

const attachmentSchema = new Schema(
  {
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'File URL is required'],
    },
    publicId: {
      type: String,
      required: [true, 'Storage public ID is required'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative'],
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Attachment must record who uploaded it'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

attachmentSchema.plugin(softDeletePlugin);

attachmentSchema.index({ task: 1, createdAt: -1 });
attachmentSchema.index({ project: 1, createdAt: -1 });
attachmentSchema.index({ comment: 1 });
attachmentSchema.index({ uploadedBy: 1 });

attachmentSchema.pre('validate', function requireParentEntity(next) {
  if (!this.task && !this.project && !this.comment) {
    this.invalidate(
      'task',
      'An attachment must be linked to at least one of task, project, or comment'
    );
  }
  next();
});

attachmentSchema.virtual('sizeInKB').get(function getSizeInKB() {
  return Math.round((this.size / 1024) * 100) / 100;
});

attachmentSchema.virtual('extension').get(function getExtension() {
  const parts = this.fileName.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
});

module.exports = mongoose.model('Attachment', attachmentSchema);
