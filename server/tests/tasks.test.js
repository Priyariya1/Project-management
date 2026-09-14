'use strict';

const { app, request, db, resetDatabase, createUser, createProject, createTask } = require('./helpers');

let owner;
let stranger;
let project;
let strangerProject;

beforeAll(async () => {
  await resetDatabase();
  owner = await createUser();
  stranger = await createUser();
  project = await createProject(owner, { name: 'Owner Project' });
  strangerProject = await createProject(stranger, { name: 'Stranger Project' });
});

afterAll(() => db.closePool());

describe('task CRUD', () => {
  let taskId;

  it('creates a task', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set(owner.auth())
      .send({
        projectId: project.id,
        name: 'Write the spec',
        description: 'Cover the API surface',
        priority: 'high',
        status: 'pending',
        dueDate: '2026-03-01',
      })
      .expect(201);

    taskId = response.body.data.task.id;
    expect(response.body.data.task).toMatchObject({
      name: 'Write the spec',
      priority: 'high',
      status: 'pending',
      dueDate: '2026-03-01',
      projectId: project.id,
      projectName: 'Owner Project',
    });
  });

  it('reads the task back', async () => {
    const response = await request(app).get(`/api/tasks/${taskId}`).set(owner.auth()).expect(200);
    expect(response.body.data.task.name).toBe('Write the spec');
  });

  it('updates the task', async () => {
    const response = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set(owner.auth())
      .send({ priority: 'low', name: 'Write the spec (v2)' })
      .expect(200);

    expect(response.body.data.task).toMatchObject({ priority: 'low', name: 'Write the spec (v2)' });
  });

  it('marks a task as completed via the dedicated endpoint', async () => {
    const response = await request(app)
      .patch(`/api/tasks/${taskId}/complete`)
      .set(owner.auth())
      .send({})
      .expect(200);

    expect(response.body.data.task.status).toBe('completed');
  });

  it('reopens a completed task', async () => {
    const response = await request(app)
      .patch(`/api/tasks/${taskId}/complete`)
      .set(owner.auth())
      .send({ completed: false })
      .expect(200);

    expect(response.body.data.task.status).toBe('pending');
  });

  it('deletes the task', async () => {
    await request(app).delete(`/api/tasks/${taskId}`).set(owner.auth()).expect(200);
    await request(app).get(`/api/tasks/${taskId}`).set(owner.auth()).expect(404);
  });
});

describe('authorization', () => {
  let ownedTask;

  beforeAll(async () => {
    ownedTask = await createTask(owner, project.id, { name: 'Private Task' });
  });

  it('does not let another user read the task', async () => {
    await request(app).get(`/api/tasks/${ownedTask.id}`).set(stranger.auth()).expect(404);
  });

  it('does not let another user update the task', async () => {
    await request(app)
      .put(`/api/tasks/${ownedTask.id}`)
      .set(stranger.auth())
      .send({ name: 'Hijacked' })
      .expect(404);
  });

  it('does not let another user delete the task', async () => {
    await request(app).delete(`/api/tasks/${ownedTask.id}`).set(stranger.auth()).expect(404);
  });

  it('does not let a user attach a task to a project they do not own', async () => {
    await request(app)
      .post('/api/tasks')
      .set(owner.auth())
      .send({ projectId: strangerProject.id, name: 'Trespassing task' })
      .expect(404);
  });

  it('does not let a user move a task into a project they do not own', async () => {
    await request(app)
      .put(`/api/tasks/${ownedTask.id}`)
      .set(owner.auth())
      .send({ projectId: strangerProject.id })
      .expect(404);
  });

  it('excludes other users\' tasks from the list', async () => {
    await createTask(stranger, strangerProject.id, { name: 'Stranger Task' });

    const response = await request(app).get('/api/tasks').set(owner.auth()).expect(200);
    const names = response.body.data.tasks.map((task) => task.name);

    expect(names).toContain('Private Task');
    expect(names).not.toContain('Stranger Task');
  });

  it('scopes the nested project task list to the owner', async () => {
    await request(app).get(`/api/projects/${strangerProject.id}/tasks`).set(owner.auth()).expect(404);
  });
});

describe('validation', () => {
  it.each([
    ['a missing project id', { name: 'No project' }],
    ['an empty name', { projectId: 1, name: '' }],
    ['an invalid priority', { projectId: 1, name: 'Valid', priority: 'urgent' }],
    ['an invalid status', { projectId: 1, name: 'Valid', status: 'done' }],
    ['an invalid due date', { projectId: 1, name: 'Valid', dueDate: '2026-13-01' }],
  ])('rejects %s', async (_label, payload) => {
    const response = await request(app).post('/api/tasks').set(owner.auth()).send(payload).expect(422);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it('rejects a project id that does not exist with 404', async () => {
    await request(app)
      .post('/api/tasks')
      .set(owner.auth())
      .send({ projectId: 999999, name: 'Orphan' })
      .expect(404);
  });
});

describe('search, filter and sort', () => {
  let filterUser;
  let filterProject;

  beforeAll(async () => {
    filterUser = await createUser();
    filterProject = await createProject(filterUser, { name: 'Filter Project' });
    await createTask(filterUser, filterProject.id, { name: 'Design login page', priority: 'high', status: 'pending' });
    await createTask(filterUser, filterProject.id, { name: 'Design signup page', priority: 'low', status: 'completed' });
    await createTask(filterUser, filterProject.id, { name: 'Deploy to staging', priority: 'medium', status: 'in_progress' });
  });

  it('searches by name', async () => {
    const response = await request(app)
      .get('/api/tasks')
      .query({ search: 'Design' })
      .set(filterUser.auth())
      .expect(200);

    expect(response.body.data.tasks).toHaveLength(2);
  });

  it('filters by status', async () => {
    const response = await request(app)
      .get('/api/tasks')
      .query({ status: 'completed' })
      .set(filterUser.auth())
      .expect(200);

    expect(response.body.data.tasks).toHaveLength(1);
    expect(response.body.data.tasks[0].name).toBe('Design signup page');
  });

  it('filters by priority', async () => {
    const response = await request(app)
      .get('/api/tasks')
      .query({ priority: 'high' })
      .set(filterUser.auth())
      .expect(200);

    expect(response.body.data.tasks).toHaveLength(1);
    expect(response.body.data.tasks[0].name).toBe('Design login page');
  });

  it('combines a search with a filter', async () => {
    const response = await request(app)
      .get('/api/tasks')
      .query({ search: 'Design', priority: 'low' })
      .set(filterUser.auth())
      .expect(200);

    expect(response.body.data.tasks).toHaveLength(1);
  });

  it('filters by project', async () => {
    const response = await request(app)
      .get('/api/tasks')
      .query({ projectId: filterProject.id })
      .set(filterUser.auth())
      .expect(200);

    expect(response.body.data.tasks).toHaveLength(3);
  });
});
