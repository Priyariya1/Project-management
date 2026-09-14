'use strict';

const express = require('express');
const validate = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { idParam } = require('../../utils/validators');
const {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuerySchema,
} = require('./project.validation');
const { listTasksQuerySchema } = require('../tasks/task.validation');
const controller = require('./project.controller');
const taskController = require('../tasks/task.controller');

const router = express.Router();

router.use(requireAuth);

router
  .route('/')
  .get(validate(listProjectsQuerySchema, 'query'), controller.list)
  .post(validate(createProjectSchema), controller.create);

router.get(
  '/:id/tasks',
  validate(idParam, 'params'),
  validate(listTasksQuerySchema, 'query'),
  taskController.listByProject,
);

router
  .route('/:id')
  .all(validate(idParam, 'params'))
  .get(controller.getOne)
  .put(validate(updateProjectSchema), controller.update)
  .patch(validate(updateProjectSchema), controller.update)
  .delete(controller.remove);

module.exports = router;
