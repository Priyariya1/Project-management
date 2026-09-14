'use strict';

const mysql = require('mysql2/promise');
const config = require('./env');
const logger = require('./logger');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  dateStrings: ['DATE'],
  multipleStatements: false,
  timezone: 'Z',
});

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function transaction(handler) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await handler(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function verifyConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    logger.info(`Connected to MySQL database "${config.db.database}" at ${config.db.host}:${config.db.port}`);
  } finally {
    connection.release();
  }
}

async function closePool() {
  await pool.end();
}

module.exports = { pool, query, queryOne, transaction, verifyConnection, closePool };
