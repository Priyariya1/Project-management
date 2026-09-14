'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/respond');
const service = require('./dashboard.service');
const auditService = require('../../services/audit.service');

const getStats = asyncHandler(async (req, res) => {
  const stats = await service.getStats(req.user.id);
  return success(res, { message: 'Dashboard statistics', data: stats });
});

const getActivity = asyncHandler(async (req, res) => {
  const activity = await auditService.listForUser(req.user.id, { limit: req.query.limit });
  return success(res, { message: 'Recent activity', data: { activity } });
});

module.exports = { getStats, getActivity };
