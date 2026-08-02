const { Server } = require('socket.io');
const env = require('../config/env');
const logger = require('../config/logger');
const { verifyAccessToken } = require('../utils/jwt');

let io = null;

const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = verifyAccessToken(token);
    socket.userId = decoded.sub;
    socket.userRole = decoded.role;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
};

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    socket.join(socket.userId);
    logger.info(`Socket connected: user=${socket.userId} socket=${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: user=${socket.userId} socket=${socket.id}`);
    });
  });

  return io;
};

const getIO = () => io;

const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(userId.toString()).emit(event, payload);
};

module.exports = { initSocket, getIO, emitToUser };
