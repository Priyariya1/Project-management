'use strict';

const AppError = require('../utils/AppError');

function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {});

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      return next(new AppError('Validation failed', 422, details));
    }

    try {
      req[source] = result.data;
    } catch {
      Object.defineProperty(req, source, { value: result.data, writable: true, configurable: true });
    }
    return next();
  };
}

module.exports = validate;
