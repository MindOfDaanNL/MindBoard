const express = require('express');
const { query, queryOne, insert, transaction } = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireOrgRole, requireProjectRole, getProjectRole } = require('../middleware/rbac');
const { publicUser } = require('../utils');

const router = express.Router();
router.use(authenticate);

// POST /api/orgs/:orgId/projects — project aanmaken
router.post('/', requireOrgRole('member'), async (req, res, next) => {
  try {
    const { orgId } = req.query;
    const { name, description, color, icon } = req.body || {};
    if (!orgId) return res.status(400).json({ error: 'orgId is verplicht (query parameter)' });
    if (!name || !name.trim()) return res.status(400).json({ error: 'Naam is verplicht' });

    const projectId = await transaction(async (conn) => {
      const r = await conn.query(
        'INSERT INTO projects (org_id, name, description, color, icon, created_by) VALUES (?, ?, ?, ?, ?, ?)',
        [
          Number(orgId),
          String(name).trim().slice(0, 128),
          description || null,
          color || '#4f46e5',
          icon || '📋',
          req.user.id
        ]
      );
      const id = Number(r.insertId);
      // Standaard bord "Kanban" aanmaken met klassieke kolommen
      const b = await conn.query('INSERT INTO boards (project_id, name, position) VALUES (?, ?, 0)', [id, 'Kanban']);
      const boardId = Number(b.insertId);
      const cols = [
        ['📋 Te doen', '#e2e8f0'],
        ['🔨 Bezig', '#fbbf24'],
        ['🔎 Review', '#38bdf8'],
        ['✅ Klaar', '#4ade80']
      ];
      for (let i = 0; i < cols.length; i++) {
        await conn.query('INSERT INTO columns (board_id, name, color, position) VALUES (?, ?, ?, ?)', [
          boardId,
          cols[i][0],
          cols[i][1],
          i
        ]);
      }
      return id;
    });

    const project = await queryOne('SELECT * FROM projects WHERE id = ?', [projectId]);
    return res.status(201).json({ project });
  } catch (e) {
    return next(e);
  }
});

// GET /api/projects/:projectId — detail met borden, leden en rollen
router.get('/:projectId', requireProjectRole('viewer'), async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const project = await queryOne(
      `SELECT p.*, o.name AS org_name FROM projects p
       JOIN orgs o ON o.id = p.org_id WHERE p.id = ?`,
      [projectId]
    );
    if (!project) return res.status(404).json({ error: 'Project niet gevonden' });

    const boards = await query(
      'SELECT * FROM boards WHERE project_id = ? ORDER BY position ASC, id ASC',
      [projectId]
    );

    const members = await query(
      `SELECT DISTINCT u.id, u.email, u.username, u.full_name, u.avatar_color, u.status,
              pm.role AS project_role
       FROM users u
       JOIN org_members om ON om.user_id = u.id AND om.org_id = ?
       LEFT JOIN project_members pm ON pm.project_id = ? AND pm.user_id = u.id
       ORDER BY u.full_name ASC`,
      [project.org_id, projectId]
    );

    const me = await getProjectRole(req.user.id, projectId);
    return res.json({ project, boards, members: members.map(publicUser), myRole: me });
  } catch (e) {
    return next(e);
  }
});

// GET /api/projects/:projectId/export — CSV-export van alle taken in het project
router.get('/:projectId/export', requireProjectRole('viewer'), async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const project = await queryOne('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) return res.status(404).json({ error: 'Project niet gevonden' });

    const rows = await query(
      `SELECT t.id, t.title, t.description, t.priority, t.due_date,
              b.name AS board, c.name AS col_name, u.username AS assignee,
              t.created_at, t.updated_at
       FROM tasks t
       JOIN boards b ON b.id = t.board_id
       JOIN columns c ON c.id = t.column_id
       LEFT JOIN users u ON u.id = t.assignee_id
       WHERE b.project_id = ?
       ORDER BY b.position ASC, c.position ASC, t.position ASC`,
      [projectId]
    );

    const esc = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const headers = ['id', 'title', 'description', 'priority', 'due_date', 'board', 'column', 'assignee', 'created_at', 'updated_at'];
    const csv = [headers.join(';'), ...rows.map((r) => headers.map((h) => esc(r[h === 'column' ? 'col_name' : h])).join(';'))].join('\r\n');

    const name = String(project.name).replace(/[^a-zA-Z0-9-_]/g, '_');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="mindboard-${name}.csv"`);
    res.send('\ufeff' + csv); // BOM voor Excel
  } catch (e) {
    return next(e);
  }
});

// PATCH /api/projects/:projectId
router.patch('/:projectId', requireProjectRole('admin'), async (req, res, next) => {
  try {
    const { name, description, color, icon, status } = req.body || {};
    const sets = [];
    const params = [];
    if (name !== undefined) { sets.push('name = ?'); params.push(String(name).trim().slice(0, 128)); }
    if (description !== undefined) { sets.push('description = ?'); params.push(description || null); }
    if (color !== undefined) { sets.push('color = ?'); params.push(color); }
    if (icon !== undefined) { sets.push('icon = ?'); params.push(icon); }
    if (status !== undefined) {
      if (!['active', 'archived'].includes(status)) return res.status(400).json({ error: 'Ongeldige status' });
      sets.push('status = ?'); params.push(status);
    }
    if (!sets.length) return res.status(400).json({ error: 'Niets om bij te werken' });
    params.push(Number(req.params.projectId));
    await query(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`, params);
    const project = await queryOne('SELECT * FROM projects WHERE id = ?', [Number(req.params.projectId)]);
    return res.json({ project });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/projects/:projectId
router.delete('/:projectId', requireProjectRole('admin'), async (req, res, next) => {
  try {
    await query('DELETE FROM projects WHERE id = ?', [Number(req.params.projectId)]);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

// ============================================================================
// Projectleden
// ============================================================================

// POST /api/projects/:projectId/members
router.post('/:projectId/members', requireProjectRole('admin'), async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const { userId, role } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is verplicht' });
    const finalRole = role && ['admin', 'member', 'viewer'].includes(role) ? role : 'member';

    const project = await queryOne('SELECT org_id FROM projects WHERE id = ?', [projectId]);
    const isOrgMember = await queryOne(
      'SELECT * FROM org_members WHERE org_id = ? AND user_id = ?',
      [project.org_id, userId]
    );
    if (!isOrgMember) return res.status(400).json({ error: 'Gebruiker is geen lid van deze organisatie' });

    await insert('INSERT IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [
      projectId,
      userId,
      finalRole
    ]);
    return res.status(201).json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

// PATCH /api/projects/:projectId/members/:userId
router.patch('/:projectId/members/:userId', requireProjectRole('admin'), async (req, res, next) => {
  try {
    const { role } = req.body || {};
    if (!role || !['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Ongeldige rol' });
    }
    await query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role)',
      [Number(req.params.projectId), Number(req.params.userId), role]
    );
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/projects/:projectId/members/:userId
router.delete('/:projectId/members/:userId', requireProjectRole('admin'), async (req, res, next) => {
  try {
    await query('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [
      Number(req.params.projectId),
      Number(req.params.userId)
    ]);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

// GET /api/projects — lijst van projecten waar ik toegang toe heb
router.get('/', async (req, res, next) => {
  try {
    const projects = await query(
      `SELECT p.*, o.name AS org_name,
              (SELECT COUNT(*) FROM tasks t WHERE t.board_id IN (SELECT id FROM boards WHERE project_id = p.id)) AS task_count
       FROM projects p
       JOIN orgs o ON o.id = p.org_id
       JOIN org_members om ON om.org_id = p.org_id AND om.user_id = ?
       WHERE p.status = 'active'
       ORDER BY p.updated_at DESC`,
      [req.user.id]
    );
    return res.json({ projects });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;