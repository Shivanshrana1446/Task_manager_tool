const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const { signAccessToken } = require('../../utils/jwt');

let mongoServer;

const setupTestDB = () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterEach(async () => {
    const { collections } = mongoose.connection;
    await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
};

const createUser = async (overrides = {}) => {
  const user = await User.create({
    name: overrides.name || 'Test User',
    email: overrides.email || `user-${new mongoose.Types.ObjectId()}@example.com`,
    password: 'StrongPass1',
    role: overrides.role || 'team_member',
  });

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });

  return { user, accessToken };
};

const authHeader = (accessToken) => ({ Authorization: `Bearer ${accessToken}` });

module.exports = { setupTestDB, createUser, authHeader };
