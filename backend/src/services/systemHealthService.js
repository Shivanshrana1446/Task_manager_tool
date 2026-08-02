const os = require('os');
const mongoose = require('mongoose');
const env = require('../config/env');

const DB_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

const toMB = (bytes) => Math.round((bytes / 1024 / 1024) * 10) / 10;

const getSystemHealth = () => {
  const memoryUsage = process.memoryUsage();
  const dbState = mongoose.connection.readyState;

  return {
    status: dbState === 1 ? 'ok' : 'degraded',
    environment: env.nodeEnv,
    serverTime: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    node: {
      version: process.version,
      platform: os.platform(),
      arch: os.arch(),
    },
    memory: {
      rssMB: toMB(memoryUsage.rss),
      heapUsedMB: toMB(memoryUsage.heapUsed),
      heapTotalMB: toMB(memoryUsage.heapTotal),
      systemFreeMB: toMB(os.freemem()),
      systemTotalMB: toMB(os.totalmem()),
    },
    cpu: {
      cores: os.cpus().length,
      loadAverage: os.loadavg(),
    },
    database: {
      status: DB_STATES[dbState] || 'unknown',
      name: mongoose.connection.name || null,
      host: mongoose.connection.host || null,
    },
  };
};

module.exports = { getSystemHealth };
