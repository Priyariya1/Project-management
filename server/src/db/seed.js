'use strict';

const bcrypt = require('bcryptjs');
const config = require('../config/env');
const db = require('../config/db');
const logger = require('../config/logger');

const DEMO_PASSWORD = 'Password123';

const DEMO_USERS = [
  { fullName: 'Ada Lovelace', email: 'ada@example.com' },
  { fullName: 'Grace Hopper', email: 'grace@example.com' },
];

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const PROJECT_BLUEPRINTS = [
  {
    name: 'Website Redesign',
    description: 'Rebuild the marketing site with a new design system and a faster build pipeline.',
    status: 'in_progress',
    startDate: daysFromNow(-20),
    endDate: daysFromNow(25),
    tasks: [
      { name: 'Audit current pages', priority: 'medium', status: 'completed', dueDate: daysFromNow(-12) },
      { name: 'Design new component library', priority: 'high', status: 'in_progress', dueDate: daysFromNow(4) },
      { name: 'Migrate blog templates', priority: 'medium', status: 'pending', dueDate: daysFromNow(12) },
      { name: 'Accessibility pass', priority: 'high', status: 'pending', dueDate: daysFromNow(18) },
      { name: 'Set up analytics events', priority: 'low', status: 'pending', dueDate: daysFromNow(21) },
    ],
  },
  {
    name: 'Mobile App Launch',
    description: 'Ship the first public release of the companion mobile app to both app stores.',
    status: 'not_started',
    startDate: daysFromNow(10),
    endDate: daysFromNow(75),
    tasks: [
      { name: 'Finalise onboarding flow', priority: 'high', status: 'pending', dueDate: daysFromNow(20) },
      { name: 'Set up crash reporting', priority: 'medium', status: 'pending', dueDate: daysFromNow(30) },
      { name: 'Write store listing copy', priority: 'low', status: 'pending', dueDate: daysFromNow(45) },
    ],
  },
  {
    name: 'Q3 Security Review',
    description: 'Internal review of authentication, authorisation and dependency hygiene.',
    status: 'completed',
    startDate: daysFromNow(-70),
    endDate: daysFromNow(-10),
    tasks: [
      { name: 'Rotate production secrets', priority: 'high', status: 'completed', dueDate: daysFromNow(-40) },
      { name: 'Patch outdated dependencies', priority: 'high', status: 'completed', dueDate: daysFromNow(-30) },
      { name: 'Document incident runbook', priority: 'medium', status: 'completed', dueDate: daysFromNow(-15) },
    ],
  },
  {
    name: 'Customer Onboarding Revamp',
    description: 'Reduce time-to-first-value for new customers from 14 days to under a week.',
    status: 'in_progress',
    startDate: daysFromNow(-5),
    endDate: daysFromNow(40),
    tasks: [
      { name: 'Interview 5 recent customers', priority: 'high', status: 'completed', dueDate: daysFromNow(-2) },
      { name: 'Draft new welcome sequence', priority: 'medium', status: 'in_progress', dueDate: daysFromNow(3) },
      { name: 'Build in-app checklist', priority: 'high', status: 'pending', dueDate: daysFromNow(-1) },
      { name: 'Measure activation rate', priority: 'low', status: 'pending', dueDate: daysFromNow(35) },
    ],
  },
];

async function seed() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, config.auth.bcryptSaltRounds);

  for (const [index, demoUser] of DEMO_USERS.entries()) {
    await db.query('DELETE FROM users WHERE email = ?', [demoUser.email]);

    const { insertId: userId } = await db.query(
      'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
      [demoUser.fullName, demoUser.email, passwordHash],
    );

    const blueprints = index === 0 ? PROJECT_BLUEPRINTS : PROJECT_BLUEPRINTS.slice(1, 2);

    for (const blueprint of blueprints) {
      const { insertId: projectId } = await db.query(
        `INSERT INTO projects (user_id, name, description, status, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, blueprint.name, blueprint.description, blueprint.status, blueprint.startDate, blueprint.endDate],
      );

      for (const task of blueprint.tasks) {
        await db.query(
          `INSERT INTO tasks (project_id, user_id, name, description, priority, status, due_date)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [projectId, userId, task.name, task.description ?? null, task.priority, task.status, task.dueDate],
        );
      }
    }

    logger.info(`Seeded ${demoUser.email} (${blueprints.length} project(s))`);
  }

  logger.info(`Demo password for every seeded account: ${DEMO_PASSWORD}`);
}

seed()
  .then(() => db.closePool())
  .then(() => process.exit(0))
  .catch(async (error) => {
    logger.error(`Seeding failed: ${error.message}`);
    await db.closePool().catch(() => {});
    process.exit(1);
  });
