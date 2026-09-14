'use strict';

const db = require('../../config/db');
const AppError = require('../../utils/AppError');
const { buildMeta } = require('../../utils/pagination');

const SORTABLE_COLUMNS = {
  created_at: 'p.created_at',
  name: 'p.name',
  status: 'p.status',
  start_date: 'p.start_date',
  end_date: 'p.end_date',
};

const BASE_SELECT = `
  SELECT p.id,
         p.name,
         p.description,
         p.status,
         p.start_date  AS startDate,
         p.end_date    AS endDate,
         p.created_at  AS createdAt,
         p.updated_at  AS updatedAt,
         COUNT(t.id)                                              AS taskCount,
         SUM(t.status = 'completed')                              AS completedTaskCount,
         SUM(t.status = 'pending')                                AS pendingTaskCount,
         SUM(t.status = 'in_progress')                            AS inProgressTaskCount
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
`;

function shapeProject(row) {
  if (!row) return null;
  const taskCount = Number(row.taskCount) || 0;
  const completedTaskCount = Number(row.completedTaskCount) || 0;
  return {
    ...row,
    taskCount,
    completedTaskCount,
    pendingTaskCount: Number(row.pendingTaskCount) || 0,
    inProgressTaskCount: Number(row.inProgressTaskCount) || 0,
    progress: taskCount === 0 ? 0 : Math.round((completedTaskCount / taskCount) * 100),
  };
}

async function list(userId, { search, status, sortBy, sortOrder, page, limit }) {
  const where = ['p.user_id = ?'];
  const params = [userId];

  if (search) {
    where.push('p.name LIKE ?');
    params.push(`%${search}%`);
  }
  if (status) {
    where.push('p.status = ?');
    params.push(status);
  }

  const whereClause = `WHERE ${where.join(' AND ')}`;
  const orderColumn = SORTABLE_COLUMNS[sortBy] || SORTABLE_COLUMNS.created_at;
  const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
  const safeLimit = Number.parseInt(limit, 10);
  const safeOffset = (Number.parseInt(page, 10) - 1) * safeLimit;

  const rows = await db.query(
    `${BASE_SELECT} ${whereClause}
     GROUP BY p.id
     ORDER BY ${orderColumn} ${direction}, p.id DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params,
  );

  const countRow = await db.queryOne(
    `SELECT COUNT(*) AS total FROM projects p ${whereClause}`,
    params,
  );
  const total = Number(countRow?.total) || 0;

  return {
    projects: rows.map(shapeProject),
    meta: buildMeta({ page, limit, total }),
  };
}

async function findById(userId, projectId) {
  const row = await db.queryOne(
    `${BASE_SELECT} WHERE p.id = ? AND p.user_id = ? GROUP BY p.id`,
    [projectId, userId],
  );
  if (!row) {
    throw AppError.notFound('Project not found');
  }
  return shapeProject(row);
}

async function create(userId, payload) {
  const { name, description = null, status = 'not_started', startDate = null, endDate = null } = payload;
  const result = await db.query(
    `INSERT INTO projects (user_id, name, description, status, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, name, description, status, startDate, endDate],
  );
  return findById(userId, result.insertId);
}

async function update(userId, projectId, payload) {
  const existing = await findById(userId, projectId);

  const columnMap = {
    name: 'name',
    description: 'description',
    status: 'status',
    startDate: 'start_date',
    endDate: 'end_date',
  };

  const assignments = [];
  const params = [];
  for (const [key, column] of Object.entries(columnMap)) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      assignments.push(`${column} = ?`);
      params.push(payload[key]);
    }
  }

  if (assignments.length === 0) return existing;

  const nextStart = Object.prototype.hasOwnProperty.call(payload, 'startDate') ? payload.startDate : existing.startDate;
  const nextEnd = Object.prototype.hasOwnProperty.call(payload, 'endDate') ? payload.endDate : existing.endDate;
  if (nextStart && nextEnd && nextStart > nextEnd) {
    throw AppError.badRequest('Validation failed', [
      { field: 'endDate', message: 'End date must be on or after the start date' },
    ]);
  }

  params.push(projectId, userId);
  await db.query(
    `UPDATE projects SET ${assignments.join(', ')} WHERE id = ? AND user_id = ?`,
    params,
  );

  return findById(userId, projectId);
}

async function remove(userId, projectId) {
  const project = await findById(userId, projectId);
  await db.query('DELETE FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
  return project;
}

async function assertOwnership(userId, projectId) {
  const row = await db.queryOne(
    'SELECT id FROM projects WHERE id = ? AND user_id = ? LIMIT 1',
    [projectId, userId],
  );
  if (!row) {
    throw AppError.notFound('Project not found');
  }
  return row.id;
}

module.exports = { list, findById, create, update, remove, assertOwnership };
