'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const config = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin) || config.corsOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use(compression());

if (!config.isTest) {
  app.use(
    morgan(config.isProduction ? 'combined' : 'dev', {
      stream: { write: (message) => logger.info(message.trim()) },
    }),
  );
}

app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use('/api', globalLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
