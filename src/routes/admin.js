const express = require('express');
const { query, queryOne } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);

// GET /api/admin/stats — platformstatistieken
router.get('/stats', async (req, res, next) => {
  try {
    const totals = await queryOne(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM orgs) AS orgs,
        (SELECT COUNT(*) FROM projects) AS projects,
        (SELECT COUNT(*) FROM boards) AS boards,
        (SELECT COUNT(*) FROM tasks) AS tasks,
        (SELECT COUNT(*) FROM comments) AS comments,
        (SELECT COUNT(*) FROM activity_log) AS activities
    `);

    const newUsers7d = await queryOne(
      'SELECT COUNT(*) AS n FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );
    const tasks7d = await queryOne(
      'SELECT COUNT(*) AS n FROM tasks WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );

    const tasksByPriority = await query(
      'SELECT priority, COUNT(*) AS n FROM tasks GROUP BY priority'
    );
    const topOrgs = await query(
      `SELECT o.id, o.name, (SELECT COUNT(*) FROM org_members m WHERE m.org_id = o.id) AS members,
              (SELECT COUNT(*) FROM projects p WHERE p.org_id = o.id) AS projects,
              (SELECT COUNT(*) FROM tasks t JOIN boards b ON b.id = t.board_id JOIN projects p2 ON p2.id = b.project_id WHERE p2.org_id = o.id) AS tasks
       FROM orgs o ORDER BY tasks DESC LIMIT 10`
    );

    return res.json({
      totals,
      newUsers7d: newUsers7d.n,
      tasks7d: tasks7d.n,
      tasksByPriority,
      topOrgs
    });
  } catch (e) {
    return next(e);
  }
});

// GET /api/admin/users — alle gebruikers (met extra velden)
router.get('/users', async (req, res, next) => {
  try {
    const users = await query(
      `SELECT u.id, u.email, u.username, u.full_name, u.avatar_color, u.role, u.status, u.created_at,
              (SELECT COUNT(*) FROM org_members om WHERE om.user_id = u.id) AS org_count,
              (SELECT COUNT(*) FROM tasks t WHERE t.created_by = u.id) AS task_count,
              (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id) AS session_count
       FROM users u ORDER BY u.created_at DESC`
    );
    return res.json({ users });
  } catch (e) {
    return next(e);
  }
});

// GET /api/admin/orgs — alle organisaties
router.get('/orgs', async (req, res, next) => {
  try {
    const orgs = await query(
      `SELECT o.*, u.username AS owner_username,
              (SELECT COUNT(*) FROM org_members m WHERE m.org_id = o.id) AS members,
              (SELECT COUNT(*) FROM projects p WHERE p.org_id = o.id) AS projects
       FROM orgs o JOIN users u ON u.id = o.owner_id
       ORDER BY o.created_at DESC`
    );
    return res.json({ orgs });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;