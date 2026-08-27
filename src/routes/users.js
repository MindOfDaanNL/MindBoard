const express = require('express');
const { query, queryOne } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { publicUser, hashPassword, verifyPassword, initials } = require('../utils');

const router = express.Router();
router.use(authenticate);

// GET /api/users/me/overview — dashboard: orgs, projecten, toegewezen taken, notificaties
router.get('/me/overview', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const orgs = await query(
      `SELECT o.*, om.role,
              (SELECT COUNT(*) FROM org_members m WHERE m.org_id = o.id) AS member_count
       FROM orgs o
       JOIN org_members om ON om.org_id = o.id
       WHERE om.user_id = ?
       ORDER BY o.name`,
      [userId]
    );

    const projects = await query(
      `SELECT p.id, p.name, p.color, p.icon, p.description, p.status, p.org_id,
              o.name AS org_name,
              COALESCE(pm.role, om.role) AS role,
              (SELECT COUNT(*) FROM tasks t WHERE t.board_id IN (SELECT id FROM boards WHERE project_id = p.id)) AS task_count,
              (SELECT COUNT(*) FROM tasks t WHERE t.board_id IN (SELECT id FROM boards WHERE project_id = p.id) AND t.column_id IN
                 (SELECT c.id FROM columns c JOIN boards b ON b.id = c.board_id WHERE b.project_id = p.id AND c.name LIKE '%done%')) AS done_count
       FROM projects p
       JOIN orgs o ON o.id = p.org_id
       JOIN org_members om ON om.org_id = p.org_id AND om.user_id = ?
       LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
       WHERE p.status = 'active' AND om.role IS NOT NULL
       ORDER BY p.updated_at DESC`,
      [userId, userId]
    );

    const myTasks = await query(
      `SELECT t.*, b.project_id, p.name AS project_name, c.name AS column_name, c.color AS column_color
       FROM tasks t
       JOIN columns c ON c.id = t.column_id
       JOIN boards b ON b.id = t.board_id
       JOIN projects p ON p.id = b.project_id
       WHERE t.assignee_id = ? AND t.column_id IN (SELECT id FROM columns WHERE name NOT LIKE '%done%')
       ORDER BY ISNULL(t.due_date) ASC, t.due_date ASC, t.created_at DESC
       LIMIT 20`,
      [userId]
    );

    const unreadCount = await queryOne(
      'SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    const recentActivity = await query(
      `SELECT a.*, u.username, u.full_name
       FROM activity_log a
       JOIN users u ON u.id = a.user_id
       WHERE a.org_id IN (SELECT org_id FROM org_members WHERE user_id = ?)
       ORDER BY a.created_at DESC
       LIMIT 15`,
      [userId]
    );

    return res.json({
      user: publicUser(req.user),
      orgs,
      projects,
      myTasks,
      unreadNotifications: unreadCount.n,
      recentActivity
    });
  } catch (e) {
    return next(e);
  }
});

// GET /api/users — (admin) alle gebruikers
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const users = await query('SELECT * FROM users ORDER BY created_at DESC');
    return res.json({ users: users.map(publicUser) });
  } catch (e) {
    return next(e);
  }
});

// PATCH /api/users/me — eigen profiel
router.patch('/me', async (req, res, next) => {
  try {
    const { fullName, avatarColor, password, currentPassword } = req.body || {};
    const sets = [];
    const params = [];

    if (fullName !== undefined) {
      sets.push('full_name = ?');
      params.push(String(fullName).slice(0, 128));
    }
    if (avatarColor !== undefined) {
      sets.push('avatar_color = ?');
      params.push(String(avatarColor));
    }
    if (password !== undefined) {
      const current = await queryOne('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
      if (!current || !verifyPassword(currentPassword, current.password_hash)) {
        return res.status(400).json({ error: 'Huidig wachtwoord is onjuist' });
      }
      if (password.length < 8) return res.status(400).json({ error: 'Wachtwoord moet minimaal 8 tekens zijn' });
      sets.push('password_hash = ?');
      params.push(hashPassword(password));
    }

    if (!sets.length) return res.status(400).json({ error: 'Niets om bij te werken' });
    params.push(req.user.id);
    await query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);

    const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
    return res.json({ user: publicUser(user) });
  } catch (e) {
    return next(e);
  }
});

// PATCH /api/users/:id — (admin) rol/status beheren
router.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { role, status } = req.body || {};
    if (role && !['admin', 'user'].includes(role)) return res.status(400).json({ error: 'Ongeldige rol' });
    if (status && !['active', 'disabled'].includes(status)) return res.status(400).json({ error: 'Ongeldige status' });

    const sets = [];
    const params = [];
    if (role) { sets.push('role = ?'); params.push(role); }
    if (status) { sets.push('status = ?'); params.push(status); }
    if (!sets.length) return res.status(400).json({ error: 'Niets om bij te werken' });

    const id = Number(req.params.id);
    if (id === req.user.id && status === 'disabled') {
      return res.status(400).json({ error: 'Je kunt je eigen account niet uitschakelen' });
    }
    params.push(id);
    const result = await query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);
    if (!result.affectedRows) return res.status(404).json({ error: 'Gebruiker niet gevonden' });

    const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
    return res.json({ user: publicUser(user) });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;