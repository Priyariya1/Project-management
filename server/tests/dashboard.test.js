'use strict';

const { app, request, db, resetDatabase, createUser, createProject, createTask } = require('./helpers');

let owner;
let stranger;

beforeAll(async () => {
  await resetDatabase();
  owner = await createUser();
  stranger = await createUser();

  const active = await createProject(owner, { name: 'Active', status: 'in_progress' });
  await createProject(owner, { name: 'Planned', status: 'not_started' });
  await createProject(owner, { name: 'Done', status: 'completed' });

  await createTask(owner, active.id, { name: 'T1', status: 'completed' });
  await createTask(owner, active.id, { name: 'T2', status: 'completed' });
  await createTask(owner, active.id, { name: 'T3', status: 'pending' });
  await createTask(owner, active.id, { name: 'T4', status: 'in_progress' });
  await createTask(owner, active.id, { name: 'Overdue', status: 'pending', dueDate: '2020-01-01' });

  const otherProject = await createProject(stranger, { name: 'Other', status: 'in_progress' });
  await createTask(stranger, otherProject.id, { name: 'Other task' });
});

afterAll(() => db.closePool());

describe('GET /api/dashboard/stats', () => {
  it('reports counts scoped to the authenticated user only', async () => {
    const response = await request(app).get('/api/dashboard/stats').set(owner.auth()).expect(200);
    const { projects, tasks, completionRate } = response.body.data;

    expect(projects).toMatchObject({ total: 3, notStarted: 1, inProgress: 1, completed: 1 });
    expect(tasks).toMatchObject({ total: 5, pending: 2, inProgress: 1, completed: 2, overdue: 1 });
    expect(completionRate).toBe(40);
  });

  it('gives a different user their own numbers', async () => {
    const response = await request(app).get('/api/dashboard/stats').set(stranger.auth()).expect(200);
    expect(response.body.data.projects.total).toBe(1);
    expect(response.body.data.tasks.total).toBe(1);
  });

  it('returns zeroes for a brand new user rather than failing', async () => {
    const fresh = await createUser();
    const response = await request(app).get('/api/dashboard/stats').set(fresh.auth()).expect(200);

    expect(response.body.data.projects.total).toBe(0);
    expect(response.body.data.tasks.total).toBe(0);
    expect(response.body.data.completionRate).toBe(0);
    expect(response.body.data.recentProjects).toEqual([]);
  });

  it('requires authentication', async () => {
    await request(app).get('/api/dashboard/stats').expect(401);
  });
});
