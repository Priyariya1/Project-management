'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/respond');
const service = require('./project.service');
const auditService = require('../../services/audit.service');

const list = asyncHandler(async (req, res) => {
  const { projects, meta } = await service.list(req.user.id, req.query);
  return success(res, { message: 'Projects retrieved', data: { projects }, meta });
});

const getOne = asyncHandler(async (req, res) => {
  const project = await service.findById(req.user.id, req.params.id);
  return success(res, { message: 'Project retrieved', data: { project } });
});

const create = asyncHandler(async (req, res) => {
  const project = await service.create(req.user.id, req.body);
  await auditService.record(req, {
    action: 'project.create',
    entityType: 'project',
    entityId: project.id,
    metadata: { name: project.name },
  });
  return success(res, { status: 201, message: 'Project created', data: { project } });
});

const update = asyncHandler(async (req, res) => {
  const project = await service.update(req.user.id, req.params.id, req.body);
  await auditService.record(req, {
    action: 'project.update',
    entityType: 'project',
    entityId: project.id,
    metadata: { fields: Object.keys(req.body) },
  });
  return success(res, { message: 'Project updated', data: { project } });
});

const remove = asyncHandler(async (req, res) => {
  const project = await service.remove(req.user.id, req.params.id);
  await auditService.record(req, {
    action: 'project.delete',
    entityType: 'project',
    entityId: project.id,
    metadata: { name: project.name },
  });
  return success(res, { message: 'Project deleted', data: { project } });
});

module.exports = { list, getOne, create, update, remove };
