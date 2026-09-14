'use strict';

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

async function resetDatabase() {
  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of ['audit_logs', 'revoked_tokens', 'tasks', 'projects', 'users']) {
    await db.query(`TRUNCATE TABLE ${table}`);
  }
  await db.query('SET FOREIGN_KEY_CHECKS = 1');
}

let counter = 0;

async function createUser(overrides = {}) {
  counter += 1;
  const payload = {
    fullName: `Test User ${counter}`,
    email: `user${counter}-${Date.now()}@example.com`,
    password: 'Password123',
    ...overrides,
  };

  const response = await request(app).post('/api/auth/register').send(payload).expect(201);

  return {
    ...response.body.data,
    password: payload.password,
    auth: () => ({ Authorization: `Bearer ${response.body.data.token}` }),
  };
}

async function createProject(actor, overrides = {}) {
  const response = await request(app)
    .post('/api/projects')
    .set(actor.auth())
    .send({ name: 'Test Project', ...overrides })
    .expect(201);
  return response.body.data.project;
}

async function createTask(actor, projectId, overrides = {}) {
  const response = await request(app)
    .post('/api/tasks')
    .set(actor.auth())
    .send({ projectId, name: 'Test Task', ...overrides })
    .expect(201);
  return response.body.data.task;
}

module.exports = { app, request, db, resetDatabase, createUser, createProject, createTask };
