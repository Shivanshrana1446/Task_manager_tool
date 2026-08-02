const FIND_HOOKS = [
  'find',
  'findOne',
  'findOneAndUpdate',
  'findOneAndDelete',
  'findOneAndReplace',
  'countDocuments',
];

const softDeletePlugin = (schema) => {
  schema.add({
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  });

  FIND_HOOKS.forEach((hook) => {
    schema.pre(hook, function excludeSoftDeleted(next) {
      if (this.getOptions().withDeleted) {
        return next();
      }
      if (!('isDeleted' in this.getQuery())) {
        this.where({ isDeleted: { $ne: true } });
      }
      next();
    });
  });

  schema.methods.softDelete = function softDelete() {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
  };

  schema.methods.restore = function restore() {
    this.isDeleted = false;
    this.deletedAt = null;
    return this.save();
  };

  schema.query.withDeleted = function withDeleted() {
    return this.setOptions({ withDeleted: true });
  };

  schema.query.onlyDeleted = function onlyDeleted() {
    return this.where({ isDeleted: true }).setOptions({ withDeleted: true });
  };
};

module.exports = softDeletePlugin;
