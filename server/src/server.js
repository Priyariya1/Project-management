'use strict';

const app = require('./app');
const config = require('./config/env');
const logger = require('./config/logger');
const db = require('./config/db');

let server;

async function start() {
  try {
    await db.verifyConnection();
  } catch (error) {
    logger.error(`Could not connect to MySQL: ${error.message}`);
    logger.error('Check the DB_* values in server/.env and that MySQL is running, then run `npm run db:migrate`.');
    process.exit(1);
  }

  server = app.listen(config.port,'0.0.0.0', () => {
    logger.info(`API listening on http://localhost:${config.port} (${config.nodeEnv})`);
  });
}

function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);
  const done = () => db.closePool().finally(() => process.exit(0));
  if (server) server.close(done);
  else done();
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled promise rejection: ${reason instanceof Error ? reason.stack : reason}`);
});
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.stack || error.message}`);
  shutdown('uncaughtException');
});

start();
