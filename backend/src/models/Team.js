const mongoose = require('mongoose');
const softDeletePlugin = require('./plugins/softDelete');

const { Schema } = mongoose;

const teamSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      minlength: [2, 'Team name must be at least 2 characters'],
      maxlength: [100, 'Team name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Team lead is required'],
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

teamSchema.plugin(softDeletePlugin);

teamSchema.index({ lead: 1, isDeleted: 1 });
teamSchema.index({ members: 1 });
teamSchema.index({ name: 'text', description: 'text' });

teamSchema.virtual('memberCount').get(function getMemberCount() {
  return this.members?.length || 0;
});

module.exports = mongoose.model('Team', teamSchema);
