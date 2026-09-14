'use strict';

const { z } = require('zod');

const dateOnly = (label) =>
  z
    .string({ invalid_type_error: `${label} must be a date string (YYYY-MM-DD)` })
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be in YYYY-MM-DD format`)
    .refine((value) => {
      const [y, m, d] = value.split('-').map(Number);
      const parsed = new Date(Date.UTC(y, m - 1, d));
      return (
        parsed.getUTCFullYear() === y &&
        parsed.getUTCMonth() === m - 1 &&
        parsed.getUTCDate() === d
      );
    }, `${label} is not a valid calendar date`);

const optionalDate = (label) =>
  z
    .union([dateOnly(label), z.literal(''), z.null()])
    .optional()
    .transform((value) => (value === '' || value === undefined ? null : value));

const requiredText = (label, { min = 1, max = 150 } = {}) =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} must be text` })
    .trim()
    .min(min, min === 1 ? `${label} cannot be empty` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

const optionalText = (label, { max = 5000 } = {}) =>
  z
    .union([z.string().trim().max(max, `${label} must be at most ${max} characters`), z.null()])
    .optional()
    .transform((value) => (value === '' || value === undefined ? null : value));

const enumField = (label, values) =>
  z.enum(values, {
    errorMap: () => ({ message: `${label} must be one of: ${values.join(', ')}` }),
  });

const idParam = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Id must be a positive integer')
    .transform(Number)
    .refine((n) => n > 0 && n <= 4294967295, 'Id is out of range'),
});

const booleanish = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((value) => value === true || value === 'true' || value === '1');

module.exports = { dateOnly, optionalDate, requiredText, optionalText, enumField, idParam, booleanish };
