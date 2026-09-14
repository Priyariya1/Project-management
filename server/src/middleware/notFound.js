'use strict';

const AppError = require('../utils/AppError');

module.exports = (req, _res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};
