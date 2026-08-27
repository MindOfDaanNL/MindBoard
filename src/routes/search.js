const express = require('express');
const { query, queryOne } = require('../db');
const { authenticate } = require('../middleware/auth');
const { getProjectRole } = require('../middleware/rbac');

const router = express.Router();
router.use(authenticate);

// GET /api/search?q=...&orgId=...
// Zoekt taken en projecten binnen organisaties waar de gebruiker lid van is.
router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const orgId = req.query.orgId ? Number(req.query.orgId) : null;
    if (!q) return res.json({ tasks: [], projects: [] });

    const like = `%${q}%`;
    const orgClause = orgId ? 'AND p.org_id = ?' : '';
    const orgParams = orgId ? [orgId] : [];

    const tasks = await query(
      `SELECT t.id, t.title, t.description, t.priority, t.due_date, t.created_at,
              b.project_id, p.name AS project_name, c.name AS column_name, p.org_id, o.name AS org_name
       FROM tasks t
       JOIN boards b ON b.id = t.board_id
       JOIN projects p ON p.id = b.project_id
       JOIN columns c ON c.id = t.column_id
       JOIN orgs o ON o.id = p.org_id
       WHERE (t.title LIKE ? OR t.description LIKE ?)
         AND p.status = 'active'
         ${orgClause}
         AND p.org_id IN (SELECT org_id FROM org_members WHERE user_id = ?)
       ORDER BY t.updated_at DESC
       LIMIT 25`,
      [like, like, ...orgParams, req.user.id]
    );

    const projects = await query(
      `SELECT p.id, p.name, p.description, p.color, p.icon, p.org_id, o.name AS org_name
       FROM projects p
       JOIN orgs o ON o.id = p.org_id
       WHERE p.name LIKE ? AND p.status = 'active' ${orgClause}
         AND p.org_id IN (SELECT org_id FROM org_members WHERE user_id = ?)
       ORDER BY p.updated_at DESC LIMIT 10`,
      [like, ...orgParams, req.user.id]
    );

    return res.json({ q, tasks, projects });
  } catch (e) {
    return next(e);
  }
});

// GET /api/activity?orgId=... — activiteitenlog van een organisatie
const activityRouter = express.Router();
activityRouter.use(authenticate);

activityRouter.get('/', async (req, res, next) => {
  try {
    const orgId = Number(req.query.orgId);
    if (!orgId) return res.status(400).json({ error: 'orgId is verplicht' });

    const isMember = await query('SELECT 1 FROM org_members WHERE org_id = ? AND user_id = ?', [orgId, req.user.id]);
    if (!isMember.length) return res.status(403).json({ error: 'Geen lid van deze organisatie' });

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const total = await queryOne('SELECT COUNT(*) AS n FROM activity_log WHERE org_id = ?', [orgId]);
    const activity = await query(
      `SELECT a.*, u.username, u.full_name, u.avatar_color FROM activity_log a
       JOIN users u ON u.id = a.user_id
       WHERE a.org_id = ? ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
      [orgId, limit, offset]
    );
    return res.json({ activity, total: total.n, page, limit, pages: Math.max(1, Math.ceil(total.n / limit)) });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
module.exports.activityRouter = activityRouter;