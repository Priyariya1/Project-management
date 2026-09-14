'use strict';

const express = require('express');
const validate = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { idParam } = require('../../utils/validators');
const {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
} = require('./task.validation');
const controller = require('./task.controller');

const router = express.Router();

router.use(requireAuth);

router
  .route('/')
  .get(validate(listTasksQuerySchema, 'query'), controller.list)
  .post(validate(createTaskSchema), controller.create);

router.patch('/:id/complete', validate(idParam, 'params'), controller.setCompletion);

router
  .route('/:id')
  .all(validate(idParam, 'params'))
  .get(controller.getOne)
  .put(validate(updateTaskSchema), controller.update)
  .patch(validate(updateTaskSchema), controller.update)
  .delete(controller.remove);

module.exports = router;
