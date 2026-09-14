'use strict';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function resolvePagination({ page, limit } = {}) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const requested = Number.parseInt(limit, 10) || DEFAULT_LIMIT;
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, requested));
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

function buildMeta({ page, limit, total }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

module.exports = { resolvePagination, buildMeta, DEFAULT_LIMIT, MAX_LIMIT };
