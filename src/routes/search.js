const express = require('express');
const { query, queryOne } = require('../db');
const { authenticate } = require('../middleware/auth');
const { getProjectRole } = require('../middleware/rbac');

const router = express.Router();
router.use(authenticate);

function parseSearch(q) {
  const filters = { text: '', assignee: null, label: null, priority: null, due: null, is: null, project: null };
  const textParts = [];
  for (const tok of String(q).split(/\s+/)) {
    if (!tok) continue;
    const idx = tok.indexOf(':');
    if (idx > 0) {
      const key = tok.slice(0, idx).toLowerCase();
      const val = tok.slice(idx + 1);
      if (['assignee', 'label', 'priority', 'due', 'is', 'project'].includes(key)) filters[key] = val.toLowerCase();
      else textParts.push(tok);
    } else {
      textParts.push(tok);
    }
  }
  filters.text = textParts.join(' ').trim();
  return filters;
}

// GET /api/search?q=...&orgId=...
// Zoekt taken en projecten binnen projecten waar de gebruiker toegang toe heeft.
// Advanced syntax: assignee:me|username  label:tag  priority:low|medium|high|urgent
//                  due:today|week|overdue  is:open|done  project:naam
router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const orgId = req.query.orgId ? Number(req.query.orgId) : null;
    const f = parseSearch(q);
    const hasFilter = Object.values(f).some((v) => v !== null && v !== '');
    if (!hasFilter) return res.json({ q, tasks: [], projects: [] });

    const orgClause = orgId ? 'AND p.org_id = ?' : '';
    const orgParams = orgId ? [orgId] : [];
    const accessClause = `(EXISTS (SELECT 1 FROM org_members om WHERE om.org_id = p.org_id AND om.user_id = ? AND om.role IN ('owner', 'admin'))
                          OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ?))`;

    const where = [];
    const params = [];

    if (f.text) {
      where.push('(t.title LIKE ? OR t.description LIKE ?)');
      params.push(`%${f.text}%`, `%${f.text}%`);
    }
    if (f.assignee) {
      if (f.assignee === 'me') {
        where.push('t.assignee_id = ?');
        params.push(req.user.id);
      } else {
        where.push('EXISTS (SELECT 1 FROM users ua WHERE ua.id = t.assignee_id AND ua.username = ?)');
        params.push(f.assignee);
      }
    }
    if (f.label) {
      where.push('EXISTS (SELECT 1 FROM task_tags tt JOIN tags tg ON tg.id = tt.tag_id WHERE tt.task_id = t.id AND tg.name = ?)');
      params.push(f.label);
    }
    if (f.priority) {
      if (['low', 'medium', 'high', 'urgent'].includes(f.priority)) { where.push('t.priority = ?'); params.push(f.priority); }
      else return res.json({ q, tasks: [], projects: [] });
    }
    if (f.due) {
      if (f.due === 'today') { where.push('t.due_date = CURDATE()'); }
      else if (f.due === 'week') { where.push('t.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)'); }
      else if (f.due === 'overdue') { where.push('t.due_date IS NOT NULL AND t.due_date < CURDATE()'); }
      else return res.json({ q, tasks: [], projects: [] });
    }
    if (f.is) {
      const doneSql = "(t.column_id IN (SELECT c.id FROM columns c WHERE c.board_id = t.board_id AND c.name REGEXP 'klaar|done|afgerond|gereed'))";
      if (f.is === 'done') where.push(doneSql);
      else if (f.is === 'open') where.push('NOT ' + doneSql);
      else return res.json({ q, tasks: [], projects: [] });
    }
    if (f.project) {
      where.push('p.name LIKE ?');
      params.push(`%${f.project}%`);
    }

    const tasks = await query(
      `SELECT t.id, t.title, t.description, t.priority, t.due_date, t.created_at,
              b.project_id, p.name AS project_name, c.name AS column_name, p.org_id, o.name AS org_name
       FROM tasks t
       JOIN boards b ON b.id = t.board_id
       JOIN projects p ON p.id = b.project_id
       JOIN columns c ON c.id = t.column_id
       JOIN orgs o ON o.id = p.org_id
       WHERE p.status = 'active'
         ${orgClause}
         AND ${accessClause}
         AND ${where.join(' AND ')}
       ORDER BY t.updated_at DESC
       LIMIT 25`,
      [...orgParams, req.user.id, req.user.id, ...params]
    );

    const projects = await query(
      `SELECT p.id, p.name, p.description, p.color, p.icon, p.org_id, o.name AS org_name
       FROM projects p
       JOIN orgs o ON o.id = p.org_id
       WHERE p.name LIKE ? AND p.status = 'active' ${orgClause}
         AND ${accessClause}
       ORDER BY p.updated_at DESC LIMIT 10`,
      [`%${f.text || q}%`, ...orgParams, req.user.id, req.user.id]
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