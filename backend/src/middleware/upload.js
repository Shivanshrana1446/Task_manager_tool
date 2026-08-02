const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { ATTACHMENT_LIMITS, AVATAR_LIMITS } = require('../config/constants');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ATTACHMENT_LIMITS.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ATTACHMENT_LIMITS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`));
  },
});

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_LIMITS.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new ApiError(400, 'Avatar must be an image file'));
  },
});

module.exports = { upload, avatarUpload };
