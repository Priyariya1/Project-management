'use strict';

const { z } = require('zod');
const {
  requiredText,
  optionalText,
  optionalDate,
  enumField,
} = require('../../utils/validators');

const TASK_STATUSES = ['pending', 'in_progress', 'completed'];
const TASK_PRIORITIES = ['low', 'medium', 'high'];

const projectIdField = z
  .union([z.number(), z.string().regex(/^\d+$/, 'Project id must be a positive integer')])
  .transform(Number)
  .refine((n) => Number.isInteger(n) && n > 0, 'Project id must be a positive integer');

const createTaskSchema = z
  .object({
    projectId: projectIdField,
    name: requiredText('Task name', { min: 2, max: 150 }),
    description: optionalText('Description'),
    priority: enumField('Priority', TASK_PRIORITIES).optional().default('medium'),
    status: enumField('Status', TASK_STATUSES).optional().default('pending'),
    dueDate: optionalDate('Due date'),
  })
  .strict();

const updateTaskSchema = z
  .object({
    projectId: projectIdField.optional(),
    name: requiredText('Task name', { min: 2, max: 150 }).optional(),
    description: optionalText('Description'),
    priority: enumField('Priority', TASK_PRIORITIES).optional(),
    status: enumField('Status', TASK_STATUSES).optional(),
    dueDate: optionalDate('Due date'),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

const listTasksQuerySchema = z
  .object({
    search: z.string().trim().max(150).optional(),
    status: enumField('Status', TASK_STATUSES).optional(),
    priority: enumField('Priority', TASK_PRIORITIES).optional(),
    projectId: projectIdField.optional(),
    sortBy: z
      .enum(['created_at', 'name', 'due_date', 'priority', 'status'])
      .optional()
      .default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  })
  .strip();

module.exports = {
  TASK_STATUSES,
  TASK_PRIORITIES,
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
};
