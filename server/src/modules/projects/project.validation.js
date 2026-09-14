'use strict';

const { z } = require('zod');
const {
  requiredText,
  optionalText,
  optionalDate,
  enumField,
} = require('../../utils/validators');

const PROJECT_STATUSES = ['not_started', 'in_progress', 'completed'];

const withDateOrder = (schema) =>
  schema.refine(
    (value) => !value.startDate || !value.endDate || value.startDate <= value.endDate,
    { message: 'End date must be on or after the start date', path: ['endDate'] },
  );

const createProjectSchema = withDateOrder(
  z
    .object({
      name: requiredText('Project name', { min: 2, max: 150 }),
      description: optionalText('Description'),
      status: enumField('Status', PROJECT_STATUSES).optional().default('not_started'),
      startDate: optionalDate('Start date'),
      endDate: optionalDate('End date'),
    })
    .strict(),
);

const updateProjectSchema = withDateOrder(
  z
    .object({
      name: requiredText('Project name', { min: 2, max: 150 }).optional(),
      description: optionalText('Description'),
      status: enumField('Status', PROJECT_STATUSES).optional(),
      startDate: optionalDate('Start date'),
      endDate: optionalDate('End date'),
    })
    .strict()
    .refine((value) => Object.keys(value).length > 0, {
      message: 'Provide at least one field to update',
    }),
);

const listProjectsQuerySchema = z
  .object({
    search: z.string().trim().max(150).optional(),
    status: enumField('Status', PROJECT_STATUSES).optional(),
    sortBy: z.enum(['created_at', 'name', 'status', 'start_date', 'end_date']).optional().default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  })
  .strip();

module.exports = {
  PROJECT_STATUSES,
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuerySchema,
};
