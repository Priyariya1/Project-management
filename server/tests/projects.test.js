'use strict';

const { app, request, db, resetDatabase, createUser, createProject, createTask } = require('./helpers');

let owner;
let stranger;

beforeAll(async () => {
  await resetDatabase();
  owner = await createUser();
  stranger = await createUser();
});

afterAll(() => db.closePool());

describe('project CRUD', () => {
  let projectId;

  it('creates a project', async () => {
    const response = await request(app)
      .post('/api/projects')
      .set(owner.auth())
      .send({
        name: 'Website Redesign',
        description: 'New marketing site',
        status: 'in_progress',
        startDate: '2026-01-01',
        endDate: '2026-06-30',
      })
      .expect(201);

    projectId = response.body.data.project.id;
    expect(response.body.data.project).toMatchObject({
      name: 'Website Redesign',
      status: 'in_progress',
      startDate: '2026-01-01',
      endDate: '2026-06-30',
      taskCount: 0,
      progress: 0,
    });
  });

  it('reads the project back', async () => {
    const response = await request(app).get(`/api/projects/${projectId}`).set(owner.auth()).expect(200);
    expect(response.body.data.project.name).toBe('Website Redesign');
  });

  it('updates the project', async () => {
    const response = await request(app)
      .put(`/api/projects/${projectId}`)
      .set(owner.auth())
      .send({ status: 'completed' })
      .expect(200);

    expect(response.body.data.project.status).toBe('completed');
    expect(response.body.data.project.name).toBe('Website Redesign');
  });

  it('lists only the owner\'s projects', async () => {
    await createProject(stranger, { name: 'Someone Else Project' });

    const response = await request(app).get('/api/projects').set(owner.auth()).expect(200);
    const names = response.body.data.projects.map((project) => project.name);

    expect(names).toContain('Website Redesign');
    expect(names).not.toContain('Someone Else Project');
  });

  it('deletes the project and cascades to its tasks', async () => {
    const project = await createProject(owner, { name: 'Doomed' });
    const task = await createTask(owner, project.id, { name: 'Doomed task' });

    await request(app).delete(`/api/projects/${project.id}`).set(owner.auth()).expect(200);
    await request(app).get(`/api/projects/${project.id}`).set(owner.auth()).expect(404);
    await request(app).get(`/api/tasks/${task.id}`).set(owner.auth()).expect(404);

    const rows = await db.query('SELECT id FROM tasks WHERE id = ?', [task.id]);
    expect(rows).toHaveLength(0);
  });
});

describe('authorization', () => {
  let ownedProject;

  beforeAll(async () => {
    ownedProject = await createProject(owner, { name: 'Private Project' });
  });

  it.each([
    ['read', 'get'],
    ['delete', 'delete'],
  ])('prevents another user from %sing the project', async (_label, method) => {
    await request(app)[method](`/api/projects/${ownedProject.id}`).set(stranger.auth()).expect(404);
  });

  it('prevents another user from updating the project', async () => {
    await request(app)
      .put(`/api/projects/${ownedProject.id}`)
      .set(stranger.auth())
      .send({ name: 'Hijacked' })
      .expect(404);

    const check = await request(app).get(`/api/projects/${ownedProject.id}`).set(owner.auth()).expect(200);
    expect(check.body.data.project.name).toBe('Private Project');
  });

  it('ignores a client-supplied owner id (no mass assignment)', async () => {
    await request(app)
      .post('/api/projects')
      .set(stranger.auth())
      .send({ name: 'Assigned To Someone Else', user_id: 1 })
      .expect(422);
  });
});

describe('validation', () => {
  it.each([
    ['an empty name', { name: '' }],
    ['an invalid status', { name: 'Valid', status: 'almost_done' }],
    ['a non-existent calendar date', { name: 'Valid', startDate: '2026-02-30' }],
    ['a malformed date', { name: 'Valid', startDate: '01/01/2026' }],
    ['an end date before the start date', { name: 'Valid', startDate: '2026-06-01', endDate: '2026-01-01' }],
  ])('rejects %s', async (_label, payload) => {
    const response = await request(app).post('/api/projects').set(owner.auth()).send(payload).expect(422);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it('rejects a non-numeric id', async () => {
    await request(app).get('/api/projects/abc').set(owner.auth()).expect(422);
  });
});

describe('search, filter, sort and pagination', () => {
  let searchUser;

  beforeAll(async () => {
    searchUser = await createUser();
    await createProject(searchUser, { name: 'Alpha Launch', status: 'completed' });
    await createProject(searchUser, { name: 'Beta Launch', status: 'in_progress' });
    await createProject(searchUser, { name: 'Gamma Research', status: 'not_started' });
  });

  it('searches by name', async () => {
    const response = await request(app)
      .get('/api/projects')
      .query({ search: 'Launch' })
      .set(searchUser.auth())
      .expect(200);

    expect(response.body.data.projects).toHaveLength(2);
  });

  it('filters by status', async () => {
    const response = await request(app)
      .get('/api/projects')
      .query({ status: 'completed' })
      .set(searchUser.auth())
      .expect(200);

    expect(response.body.data.projects).toHaveLength(1);
    expect(response.body.data.projects[0].name).toBe('Alpha Launch');
  });

  it('sorts by name ascending', async () => {
    const response = await request(app)
      .get('/api/projects')
      .query({ sortBy: 'name', sortOrder: 'asc' })
      .set(searchUser.auth())
      .expect(200);

    expect(response.body.data.projects.map((p) => p.name)).toEqual([
      'Alpha Launch',
      'Beta Launch',
      'Gamma Research',
    ]);
  });

  it('paginates', async () => {
    const response = await request(app)
      .get('/api/projects')
      .query({ page: 2, limit: 2, sortBy: 'name', sortOrder: 'asc' })
      .set(searchUser.auth())
      .expect(200);

    expect(response.body.data.projects).toHaveLength(1);
    expect(response.body.meta).toMatchObject({ page: 2, limit: 2, total: 3, totalPages: 2, hasNextPage: false });
  });

  it('rejects an injection attempt in sortBy instead of interpolating it', async () => {
    await request(app)
      .get('/api/projects')
      .query({ sortBy: 'name; DROP TABLE users' })
      .set(searchUser.auth())
      .expect(422);

    const tables = await db.query("SHOW TABLES LIKE 'users'");
    expect(tables).toHaveLength(1);
  });

  it('treats injection characters in search as literal text', async () => {
    const response = await request(app)
      .get('/api/projects')
      .query({ search: "' OR 1=1 -- " })
      .set(searchUser.auth())
      .expect(200);

    expect(response.body.data.projects).toHaveLength(0);
  });
});
