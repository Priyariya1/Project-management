'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const authService = require('../modules/auth/auth.service');

function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  if (req.cookies?.token) return req.cookies.token;
  return null;
}

const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    throw AppError.unauthorized('Authentication required. Provide a Bearer token.');
  }

  const payload = jwt.verify(token, config.auth.jwtSecret);

  if (payload.jti && (await authService.isTokenRevoked(payload.jti))) {
    throw AppError.unauthorized('This session has been logged out. Please log in again.');
  }

  const user = await authService.findPublicUserById(payload.sub);
  if (!user) {
    throw AppError.unauthorized('The account for this token no longer exists');
  }

  req.user = user;
  req.token = { raw: token, jti: payload.jti, expiresAt: new Date(payload.exp * 1000) };
  next();
});

module.exports = { requireAuth, extractToken };
