'use strict';

const { app, request, db, resetDatabase, createUser } = require('./helpers');

beforeAll(resetDatabase);
afterAll(() => db.closePool());

describe('POST /api/auth/register', () => {
  it('creates an account and returns a token, never the password', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Ada Lovelace', email: 'register-ok@example.com', password: 'Password123' })
      .expect(201);

    expect(response.body.data.user).toMatchObject({
      fullName: 'Ada Lovelace',
      email: 'register-ok@example.com',
    });
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(JSON.stringify(response.body)).not.toMatch(/password/i);
  });

  it('stores the password as a bcrypt hash, never in plain text', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Hash Check', email: 'hash-check@example.com', password: 'Password123' })
      .expect(201);

    const row = await db.queryOne('SELECT password_hash FROM users WHERE email = ?', ['hash-check@example.com']);
    expect(row.password_hash).not.toBe('Password123');
    expect(row.password_hash).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate email with 409', async () => {
    const payload = { fullName: 'First', email: 'dupe@example.com', password: 'Password123' };
    await request(app).post('/api/auth/register').send(payload).expect(201);
    await request(app).post('/api/auth/register').send(payload).expect(409);
  });

  it.each([
    ['an invalid email', { fullName: 'X Y', email: 'nope', password: 'Password123' }],
    ['a short password', { fullName: 'X Y', email: 'short@example.com', password: 'Pw1' }],
    ['a password with no uppercase', { fullName: 'X Y', email: 'weak@example.com', password: 'password123' }],
    ['a missing name', { email: 'noname@example.com', password: 'Password123' }],
    ['an empty name', { fullName: '   ', email: 'blank@example.com', password: 'Password123' }],
  ])('rejects %s with 422 and a field-level error', async (_label, payload) => {
    const response = await request(app).post('/api/auth/register').send(payload).expect(422);
    expect(response.body.errors.length).toBeGreaterThan(0);
    expect(response.body.errors[0]).toHaveProperty('field');
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token for valid credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Login User', email: 'login@example.com', password: 'Password123' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'Password123' })
      .expect(200);

    expect(response.body.data.token).toEqual(expect.any(String));
  });

  it('rejects a wrong password with 401 and an ambiguous message', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'WrongPassword1' })
      .expect(401);

    expect(response.body.message).toBe('Invalid email or password');
  });

  it('returns the same message for an unknown email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'Password123' })
      .expect(401);

    expect(response.body.message).toBe('Invalid email or password');
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes the token server-side', async () => {
    const actor = await createUser();

    await request(app).get('/api/projects').set(actor.auth()).expect(200);
    await request(app).post('/api/auth/logout').set(actor.auth()).expect(200);
    await request(app).get('/api/projects').set(actor.auth()).expect(401);
  });
});

describe('token handling', () => {
  it('rejects a request with no token', async () => {
    await request(app).get('/api/projects').expect(401);
  });

  it('rejects a tampered token', async () => {
    const actor = await createUser();
    const tampered = `${actor.token.split('.').slice(0, 2).join('.')}.forged`;
    await request(app).get('/api/projects').set('Authorization', `Bearer ${tampered}`).expect(401);
  });
});
