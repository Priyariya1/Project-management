'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const db = require('../../config/db');
const AppError = require('../../utils/AppError');

const PUBLIC_USER_COLUMNS = 'id, full_name AS fullName, email, created_at AS createdAt';

function signToken(user) {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { sub: user.id, email: user.email, jti },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpiresIn },
  );
  const { exp } = jwt.decode(token);
  return { token, jti, expiresAt: new Date(exp * 1000) };
}

async function findUserByEmail(email) {
  return db.queryOne(
    'SELECT id, full_name AS fullName, email, password_hash AS passwordHash FROM users WHERE email = ? LIMIT 1',
    [email],
  );
}

async function findPublicUserById(id) {
  return db.queryOne(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = ? LIMIT 1`, [id]);
}

async function register({ fullName, email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw AppError.conflict('An account with this email address already exists');
  }

  const passwordHash = await bcrypt.hash(password, config.auth.bcryptSaltRounds);

  let insertId;
  try {
    const result = await db.query(
      'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
      [fullName, email, passwordHash],
    );
    insertId = result.insertId;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw AppError.conflict('An account with this email address already exists');
    }
    throw error;
  }

  const user = await findPublicUserById(insertId);
  const { token, expiresAt } = signToken(user);
  return { user, token, expiresAt };
}

async function login({ email, password }) {
  const user = await findUserByEmail(email);

  const hash = user?.passwordHash || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
  const passwordMatches = await bcrypt.compare(password, hash);

  if (!user || !passwordMatches) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const publicUser = { id: user.id, fullName: user.fullName, email: user.email };
  const { token, expiresAt } = signToken(publicUser);
  return { user: publicUser, token, expiresAt };
}

async function logout({ jti, userId, expiresAt }) {
  await db.query(
    'INSERT IGNORE INTO revoked_tokens (jti, user_id, expires_at) VALUES (?, ?, ?)',
    [jti, userId, expiresAt],
  );
  await db.query('DELETE FROM revoked_tokens WHERE expires_at < NOW()');
}

async function isTokenRevoked(jti) {
  const row = await db.queryOne('SELECT jti FROM revoked_tokens WHERE jti = ? LIMIT 1', [jti]);
  return Boolean(row);
}

module.exports = {
  register,
  login,
  logout,
  isTokenRevoked,
  findPublicUserById,
  signToken,
};
