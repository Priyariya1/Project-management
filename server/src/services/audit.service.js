'use strict';

const db = require('../config/db');
const logger = require('../config/logger');

async function record(req, { action, entityType, entityId = null, metadata = null }) {
  try {
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.user?.id ?? null,
        action,
        entityType,
        entityId,
        metadata ? JSON.stringify(metadata) : null,
        req.ip ?? null,
      ],
    );
  } catch (error) {
    logger.warn(`Failed to write audit log for ${action}: ${error.message}`);
  }
}

async function listForUser(userId, { limit = 50 } = {}) {
  const safeLimit = Math.min(200, Math.max(1, Number.parseInt(limit, 10) || 50));
  return db.query(
    `SELECT id, action, entity_type AS entityType, entity_id AS entityId, metadata, created_at AS createdAt
       FROM audit_logs
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT ${safeLimit}`,
    [userId],
  );
}

module.exports = { record, listForUser };
