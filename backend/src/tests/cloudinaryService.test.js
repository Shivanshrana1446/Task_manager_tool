jest.mock('../config/cloudinary', () => ({
  uploader: {
    upload_stream: jest.fn((options, callback) => ({
      end: () => callback(null, { secure_url: 'https://cdn.example.com/test.png', public_id: 'folder/test' }),
    })),
    destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
  },
}));

const cloudinary = require('../config/cloudinary');
const { uploadBuffer, deleteAsset } = require('../services/cloudinaryService');

afterEach(() => {
  jest.clearAllMocks();
});

describe('cloudinaryService.uploadBuffer', () => {
  it('resolves with the upload result on success', async () => {
    const result = await uploadBuffer(Buffer.from('data'), { folder: 'avatars', resourceType: 'image' });

    expect(result.secure_url).toBe('https://cdn.example.com/test.png');
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      { folder: 'avatars', resource_type: 'image' },
      expect.any(Function)
    );
  });

  it('defaults resourceType to "auto" when not provided', async () => {
    await uploadBuffer(Buffer.from('data'), { folder: 'misc' });

    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      { folder: 'misc', resource_type: 'auto' },
      expect.any(Function)
    );
  });

  it('rejects when the upload stream reports an error', async () => {
    cloudinary.uploader.upload_stream.mockImplementationOnce((options, callback) => ({
      end: () => callback(new Error('upload failed')),
    }));

    await expect(uploadBuffer(Buffer.from('data'), { folder: 'avatars' })).rejects.toThrow(
      'upload failed'
    );
  });
});

describe('cloudinaryService.deleteAsset', () => {
  it('deletes an asset with the given resource type', async () => {
    await deleteAsset('folder/test', { resourceType: 'image' });
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('folder/test', { resource_type: 'image' });
  });

  it('defaults resourceType to "auto" when not provided', async () => {
    await deleteAsset('folder/test');
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('folder/test', { resource_type: 'auto' });
  });
});
