'use strict';

const config = require('../config/env');
const logger = require('../config/logger');
const AppError = require('../utils/AppError');

function translateDatabaseError(error) {
  switch (error.code) {
    case 'ER_DUP_ENTRY':
      return new AppError('A record with these details already exists', 409);
    case 'ER_NO_REFERENCED_ROW':
    case 'ER_NO_REFERENCED_ROW_2':
      return new AppError('Referenced record does not exist', 400);
    case 'ER_ROW_IS_REFERENCED':
    case 'ER_ROW_IS_REFERENCED_2':
      return new AppError('This record is still referenced by other records', 409);
    case 'ER_DATA_TOO_LONG':
      return new AppError('One of the submitted values is too long', 400);
    case 'ECONNREFUSED':
    case 'PROTOCOL_CONNECTION_LOST':
    case 'ER_ACCESS_DENIED_ERROR':
      return new AppError('Database is unavailable. Please try again shortly.', 503);
    default:
      return null;
  }
}

module.exports = (err, req, res, _next) => {
  let error = err;

  if (!(error instanceof AppError)) {
    if (error.name === 'JsonWebTokenError') {
      error = AppError.unauthorized('Invalid authentication token');
    } else if (error.name === 'TokenExpiredError') {
      error = AppError.unauthorized('Your session has expired. Please log in again.');
    } else if (error.type === 'entity.parse.failed') {
      error = AppError.badRequest('Request body is not valid JSON');
    } else if (error.type === 'entity.too.large') {
      error = AppError.badRequest('Request body is too large');
    } else {
      error = translateDatabaseError(error) || error;
    }
  }

  const statusCode = error.statusCode || 500;
  const isServerError = statusCode >= 500;

  const logPayload = {
    method: req.method,
    url: req.originalUrl,
    status: statusCode,
    userId: req.user?.id,
    ip: req.ip,
  };

  if (isServerError) {
    logger.error(err.stack || err.message, logPayload);
  } else {
    logger.warn(`${error.message}`, logPayload);
  }

  const body = {
    success: false,
    message: isServerError && !error.isOperational
      ? 'Something went wrong. Please try again later.'
      : error.message,
  };
  if (error.details) body.errors = error.details;
  if (!config.isProduction && isServerError) body.stack = err.stack;

  res.status(statusCode).json(body);
};
