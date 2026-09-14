'use strict';

const winston = require('winston');
const config = require('./env');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} ${level}: ${stack || message}${extra}`;
});

const logger = winston.createLogger({
  level: config.logLevel,
  format: config.isProduction
    ? combine(timestamp(), errors({ stack: true }), json())
    : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), devFormat),
  transports: [
    new winston.transports.Console({
      silent: config.isTest && process.env.DEBUG_TESTS !== '1',
    }),
  ],
});

logger.stream = {
  write: (message) => logger.http
    ? logger.http(message.trim())
    : logger.info(message.trim()),
};

module.exports = logger;
