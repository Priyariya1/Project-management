'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/respond');
const authService = require('./auth.service');
const auditService = require('../../services/audit.service');

const register = asyncHandler(async (req, res) => {
  const { user, token, expiresAt } = await authService.register(req.body);
  await auditService.record(req, { action: 'user.register', entityType: 'user', entityId: user.id });
  return success(res, {
    status: 201,
    message: 'Account created successfully',
    data: { user, token, expiresAt },
  });
});

const login = asyncHandler(async (req, res) => {
  const { user, token, expiresAt } = await authService.login(req.body);
  await auditService.record({ ...req, user }, { action: 'user.login', entityType: 'user', entityId: user.id });
  return success(res, {
    message: 'Logged in successfully',
    data: { user, token, expiresAt },
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout({
    jti: req.token.jti,
    userId: req.user.id,
    expiresAt: req.token.expiresAt,
  });
  await auditService.record(req, { action: 'user.logout', entityType: 'user', entityId: req.user.id });
  return success(res, { message: 'Logged out successfully' });
});

const me = asyncHandler(async (req, res) =>
  success(res, { message: 'Current user', data: { user: req.user } }));

module.exports = { register, login, logout, me };
