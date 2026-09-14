'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function read(key, { fallback, required = false } = {}) {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (required) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return fallback;
  }
  return value;
}

function readInt(key, fallback) {
  const raw = read(key, { fallback: String(fallback) });
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const nodeEnv = read('NODE_ENV', { fallback: 'development' });
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

const jwtSecret = read('JWT_SECRET', { required: isProduction, fallback: 'dev-only-insecure-secret' });
if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long in production.');
}

const config = {
  nodeEnv,
  isProduction,
  isTest,
  port: readInt('PORT', 4000),
  corsOrigins: read('CORS_ORIGIN', { fallback: 'http://localhost:5173' })
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  db: {
    host: read('DB_HOST', { fallback: '127.0.0.1' }),
    port: readInt('DB_PORT', 3306),
    user: read('DB_USER', { fallback: 'root' }),
    password: read('DB_PASSWORD', { fallback: '' }),
    database: isTest
      ? `${read('DB_NAME', { fallback: 'project_management' })}_test`
      : read('DB_NAME', { fallback: 'project_management' }),
    connectionLimit: readInt('DB_CONNECTION_LIMIT', 10),
    rootUser: read('DB_ROOT_USER', { fallback: '' }),
    rootPassword: read('DB_ROOT_PASSWORD', { fallback: '' }),
  },

  auth: {
    jwtSecret,
    jwtExpiresIn: read('JWT_EXPIRES_IN', { fallback: '1d' }),
    bcryptSaltRounds: readInt('BCRYPT_SALT_ROUNDS', isTest ? 4 : 12),
  },

  rateLimit: {
    auth: {
      windowMs: readInt('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
      max: readInt('AUTH_RATE_LIMIT_MAX', 10),
    },
    global: {
      windowMs: readInt('GLOBAL_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
      max: readInt('GLOBAL_RATE_LIMIT_MAX', 500),
    },
  },

  logLevel: read('LOG_LEVEL', { fallback: isTest ? 'error' : 'info' }),
};

module.exports = config;
