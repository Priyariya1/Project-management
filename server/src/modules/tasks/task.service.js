'use strict';

const db = require('../../config/db');
const AppError = require('../../utils/AppError');
const { buildMeta } = require('../../utils/pagination');
const projectService = require('../projects/project.service');

const SORTABLE_COLUMNS = {
  created_at: 't.created_at',
  name: 't.name',
  due_date: 't.due_date',
  priority: 't.priority',
  status: 't.status',
};

const BASE_SELECT = `
  SELECT t.id,
         t.project_id  AS projectId,
         p.name        AS projectName,
         t.name,
         t.description,
         t.priority,
         t.status,
         t.due_date    AS dueDate,
         t.created_at  AS createdAt,
         t.updated_at  AS updatedAt
    FROM tasks t
    INNER JOIN projects p ON p.id = t.project_id
`;

async function list(userId, { search, status, priority, projectId, sortBy, sortOrder, page, limit }) {
  const where = ['t.user_id = ?'];
  const params = [userId];

  if (search) {
    where.push('t.name LIKE ?');
    params.push(`%${search}%`);
  }
  if (status) {
    where.push('t.status = ?');
    params.push(status);
  }
  if (priority) {
    where.push('t.priority = ?');
    params.push(priority);
  }
  if (projectId) {
    where.push('t.project_id = ?');
    params.push(projectId);
  }

  const whereClause = `WHERE ${where.join(' AND ')}`;
  const orderColumn = SORTABLE_COLUMNS[sortBy] || SORTABLE_COLUMNS.created_at;
  const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';
  const safeLimit = Number.parseInt(limit, 10);
  const safeOffset = (Number.parseInt(page, 10) - 1) * safeLimit;

  const rows = await db.query(
    `${BASE_SELECT} ${whereClause}
     ORDER BY ${orderColumn} ${direction}, t.id DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params,
  );

  const countRow = await db.queryOne(
    `SELECT COUNT(*) AS total FROM tasks t ${whereClause}`,
    params,
  );

  return {
    tasks: rows,
    meta: buildMeta({ page, limit, total: Number(countRow?.total) || 0 }),
  };
}

async function findById(userId, taskId) {
  const row = await db.queryOne(`${BASE_SELECT} WHERE t.id = ? AND t.user_id = ?`, [taskId, userId]);
  if (!row) {
    throw AppError.notFound('Task not found');
  }
  return row;
}

async function create(userId, payload) {
  const { projectId, name, description = null, priority = 'medium', status = 'pending', dueDate = null } = payload;

  await projectService.assertOwnership(userId, projectId);

  const result = await db.query(
    `INSERT INTO tasks (project_id, user_id, name, description, priority, status, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [projectId, userId, name, description, priority, status, dueDate],
  );

  return findById(userId, result.insertId);
}

async function update(userId, taskId, payload) {
  await findById(userId, taskId);

  if (payload.projectId !== undefined) {
    await projectService.assertOwnership(userId, payload.projectId);
  }

  const columnMap = {
    projectId: 'project_id',
    name: 'name',
    description: 'description',
    priority: 'priority',
    status: 'status',
    dueDate: 'due_date',
  };

  const assignments = [];
  const params = [];
  for (const [key, column] of Object.entries(columnMap)) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      assignments.push(`${column} = ?`);
      params.push(payload[key]);
    }
  }

  if (assignments.length > 0) {
    params.push(taskId, userId);
    await db.query(
      `UPDATE tasks SET ${assignments.join(', ')} WHERE id = ? AND user_id = ?`,
      params,
    );
  }

  return findById(userId, taskId);
}

async function setCompletion(userId, taskId, completed) {
  return update(userId, taskId, { status: completed ? 'completed' : 'pending' });
}

async function remove(userId, taskId) {
  const task = await findById(userId, taskId);
  await db.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
  return task;
}

module.exports = { list, findById, create, update, remove, setCompletion };
