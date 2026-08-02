const crypto = require('crypto');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const env = require('../config/env');
const { ROLE_VALUES, ROLES } = require('../config/roles');
const hashToken = require('../utils/hashToken');
const softDeletePlugin = require('./plugins/softDelete');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.TEAM_MEMBER,
    },
    avatar: {
      url: { type: String, default: null },
      publicId: { type: String, default: null, select: false },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.plugin(softDeletePlugin);

// Partial unique index: allows a new account to reuse an email address
// once the previous account holding it has been soft-deleted.
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
userSchema.index({ role: 1, isDeleted: 1 });

userSchema.virtual('ownedProjects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'owner',
});

userSchema.virtual('assignedTasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'assignees',
});

userSchema.virtual('reportedTasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'reporter',
});

userSchema.virtual('authoredComments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'author',
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptSaltRounds);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = hashToken(rawToken);
  this.passwordResetExpires = Date.now() + env.resetPasswordTokenExpiresMinutes * 60 * 1000;

  return rawToken;
};

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
