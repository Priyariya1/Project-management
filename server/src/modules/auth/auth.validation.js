'use strict';

const { z } = require('zod');

const trimmed = (min, max, label) =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} must be text` })
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .max(255, 'Email must be at most 255 characters')
  .email('Please provide a valid email address');

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

const registerSchema = z
  .object({
    fullName: trimmed(2, 120, 'Full name'),
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  })
  .strict();

module.exports = { registerSchema, loginSchema };
