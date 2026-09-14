'use strict';

const db = require('../../config/db');

async function getStats(userId) {
  const [projectStats] = await db.query(
    `SELECT COUNT(*)                        AS totalProjects,
            SUM(status = 'not_started')     AS notStartedProjects,
            SUM(status = 'in_progress')     AS inProgressProjects,
            SUM(status = 'completed')       AS completedProjects
       FROM projects
      WHERE user_id = ?`,
    [userId],
  );

  const [taskStats] = await db.query(
    `SELECT COUNT(*)                        AS totalTasks,
            SUM(status = 'pending')         AS pendingTasks,
            SUM(status = 'in_progress')     AS inProgressTasks,
            SUM(status = 'completed')       AS completedTasks,
            SUM(priority = 'high')          AS highPriorityTasks,
            SUM(priority = 'medium')        AS mediumPriorityTasks,
            SUM(priority = 'low')           AS lowPriorityTasks,
            SUM(due_date IS NOT NULL AND due_date < CURDATE() AND status <> 'completed') AS overdueTasks,
            SUM(due_date = CURDATE() AND status <> 'completed')                          AS dueTodayTasks
       FROM tasks
      WHERE user_id = ?`,
    [userId],
  );

  const recentProjects = await db.query(
    `SELECT id, name, status, start_date AS startDate, end_date AS endDate, created_at AS createdAt
       FROM projects
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 5`,
    [userId],
  );

  const upcomingTasks = await db.query(
    `SELECT t.id, t.name, t.priority, t.status, t.due_date AS dueDate,
            t.project_id AS projectId, p.name AS projectName
       FROM tasks t
       INNER JOIN projects p ON p.id = t.project_id
      WHERE t.user_id = ? AND t.status <> 'completed' AND t.due_date IS NOT NULL
      ORDER BY t.due_date ASC, t.id ASC
      LIMIT 5`,
    [userId],
  );

  const n = (value) => Number(value) || 0;
  const totalTasks = n(taskStats.totalTasks);
  const completedTasks = n(taskStats.completedTasks);

  return {
    projects: {
      total: n(projectStats.totalProjects),
      notStarted: n(projectStats.notStartedProjects),
      inProgress: n(projectStats.inProgressProjects),
      completed: n(projectStats.completedProjects),
    },
    tasks: {
      total: totalTasks,
      pending: n(taskStats.pendingTasks),
      inProgress: n(taskStats.inProgressTasks),
      completed: completedTasks,
      overdue: n(taskStats.overdueTasks),
      dueToday: n(taskStats.dueTodayTasks),
      byPriority: {
        high: n(taskStats.highPriorityTasks),
        medium: n(taskStats.mediumPriorityTasks),
        low: n(taskStats.lowPriorityTasks),
      },
    },
    completionRate: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
    recentProjects,
    upcomingTasks,
  };
}

module.exports = { getStats };
