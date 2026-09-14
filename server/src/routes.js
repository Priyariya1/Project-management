'use strict';

const express = require('express');
const authRoutes = require('./modules/auth/auth.routes');
const projectRoutes = require('./modules/projects/project.routes');
const taskRoutes = require('./modules/tasks/task.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Project Management System API',
    version: '1.0.0',
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'POST /api/auth/logout', 'GET /api/auth/me'],
      projects: [
        'GET /api/projects',
        'POST /api/projects',
        'GET /api/projects/:id',
        'PUT /api/projects/:id',
        'DELETE /api/projects/:id',
        'GET /api/projects/:id/tasks',
      ],
      tasks: [
        'GET /api/tasks',
        'POST /api/tasks',
        'GET /api/tasks/:id',
        'PUT /api/tasks/:id',
        'PATCH /api/tasks/:id/complete',
        'DELETE /api/tasks/:id',
      ],
      dashboard: ['GET /api/dashboard/stats', 'GET /api/dashboard/activity'],
    },
  });
});

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
