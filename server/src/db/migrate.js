'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config/env');
const logger = require('../config/logger');

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const fresh = process.argv.includes('--fresh');

function assertSafeIdentifier(name) {
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(`Unsafe database name: ${name}`);
  }
  return name;
}

async function ensureDatabaseExists() {
  const dbName = assertSafeIdentifier(config.db.database);
  const user = config.db.rootUser || config.db.user;
  const password = config.db.rootUser ? config.db.rootPassword : config.db.password;

  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user,
    password,
    multipleStatements: true,
  });

  try {
    if (fresh) {
      logger.warn(`--fresh: dropping database \`${dbName}\``);
      await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    }
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    logger.info(`Database \`${dbName}\` is ready`);

    if (config.db.rootUser && config.db.user !== config.db.rootUser) {
      await connection.query(
        `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO ?@'%'`,
        [config.db.user],
      ).catch(() => {
        logger.warn(`Could not grant privileges on \`${dbName}\` to "${config.db.user}" — grant them manually if needed.`);
      });
    }
  } finally {
    await connection.end();
  }
}

async function applySchema() {
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
    logger.info('Schema applied successfully (users, projects, tasks, revoked_tokens, audit_logs)');
  } finally {
    await connection.end();
  }
}

(async () => {
  try {
    await ensureDatabaseExists();
    await applySchema();
    process.exit(0);
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      logger.error('Check DB_USER / DB_PASSWORD (and DB_ROOT_USER / DB_ROOT_PASSWORD) in server/.env');
    }
    process.exit(1);
  }
})();
