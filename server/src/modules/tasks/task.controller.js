'use strict';

const { z } = require('zod');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/respond');
const service = require('./task.service');
const projectService = require('../projects/project.service');
const auditService = require('../../services/audit.service');

const list = asyncHandler(async (req, res) => {
  const { tasks, meta } = await service.list(req.user.id, req.query);
  return success(res, { message: 'Tasks retrieved', data: { tasks }, meta });
});

const listByProject = asyncHandler(async (req, res) => {
  await projectService.assertOwnership(req.user.id, req.params.id);
  const { tasks, meta } = await service.list(req.user.id, { ...req.query, projectId: req.params.id });
  return success(res, { message: 'Tasks retrieved', data: { tasks }, meta });
});

const getOne = asyncHandler(async (req, res) => {
  const task = await service.findById(req.user.id, req.params.id);
  return success(res, { message: 'Task retrieved', data: { task } });
});

const create = asyncHandler(async (req, res) => {
  const task = await service.create(req.user.id, req.body);
  await auditService.record(req, {
    action: 'task.create',
    entityType: 'task',
    entityId: task.id,
    metadata: { name: task.name, projectId: task.projectId },
  });
  return success(res, { status: 201, message: 'Task created', data: { task } });
});

const update = asyncHandler(async (req, res) => {
  const task = await service.update(req.user.id, req.params.id, req.body);
  await auditService.record(req, {
    action: 'task.update',
    entityType: 'task',
    entityId: task.id,
    metadata: { fields: Object.keys(req.body) },
  });
  return success(res, { message: 'Task updated', data: { task } });
});

const completionSchema = z
  .object({ completed: z.boolean().optional().default(true) })
  .strict();

const setCompletion = asyncHandler(async (req, res) => {
  const { completed } = completionSchema.parse(req.body ?? {});
  const task = await service.setCompletion(req.user.id, req.params.id, completed);
  await auditService.record(req, {
    action: completed ? 'task.complete' : 'task.reopen',
    entityType: 'task',
    entityId: task.id,
  });
  return success(res, {
    message: completed ? 'Task marked as completed' : 'Task reopened',
    data: { task },
  });
});

const remove = asyncHandler(async (req, res) => {
  const task = await service.remove(req.user.id, req.params.id);
  await auditService.record(req, {
    action: 'task.delete',
    entityType: 'task',
    entityId: task.id,
    metadata: { name: task.name },
  });
  return success(res, { message: 'Task deleted', data: { task } });
});

module.exports = { list, listByProject, getOne, create, update, remove, setCompletion };
