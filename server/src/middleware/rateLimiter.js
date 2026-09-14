'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const jsonLimitResponse = (message) => (req, res) => {
  res.status(429).json({ success: false, message });
};

const authLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => config.isTest,
  handler: jsonLimitResponse(
    'Too many authentication attempts from this IP. Please try again later.',
  ),
});

const globalLimiter = rateLimit({
  windowMs: config.rateLimit.global.windowMs,
  max: config.rateLimit.global.max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isTest,
  handler: jsonLimitResponse('Too many requests. Please slow down.'),
});

module.exports = { authLimiter, globalLimiter };
