const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./docs/swagger');
const apiLimiter = require('./middleware/rateLimiter');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Core middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(compression());

if (env.nodeEnv !== 'test') {
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
}

app.use(env.apiPrefix, apiLimiter);

// API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy' });
});

// Routes
app.use(`${env.apiPrefix}/auth`, require('./routes/authRoutes'));
app.use(`${env.apiPrefix}/users`, require('./routes/userRoutes'));
app.use(`${env.apiPrefix}/projects`, require('./routes/projectRoutes'));
app.use(`${env.apiPrefix}/tasks`, require('./routes/taskRoutes'));
app.use(`${env.apiPrefix}/comments`, require('./routes/commentRoutes'));
app.use(`${env.apiPrefix}/attachments`, require('./routes/attachmentRoutes'));
app.use(`${env.apiPrefix}/notifications`, require('./routes/notificationRoutes'));
app.use(`${env.apiPrefix}/dashboard`, require('./routes/dashboardRoutes'));
app.use(`${env.apiPrefix}/teams`, require('./routes/teamRoutes'));
app.use(`${env.apiPrefix}/admin`, require('./routes/adminRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
