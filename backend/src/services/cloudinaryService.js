const cloudinary = require('../config/cloudinary');

const uploadBuffer = (buffer, { folder, resourceType = 'auto', publicId } = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType, public_id: publicId },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });

const deleteAsset = (publicId, { resourceType = 'auto' } = {}) =>
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

module.exports = { uploadBuffer, deleteAsset };
