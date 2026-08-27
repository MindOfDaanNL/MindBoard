const express = require('express');
const { query, queryOne, insert, transaction } = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireOrgRole } = require('../middleware/rbac');
const { slugify, uniqueSlug, randomToken, publicUser } = require('../utils');

const router = express.Router();
router.use(authenticate);

// GET /api/orgs — mijn organisaties
router.get('/', async (req, res, next) => {
  try {
    const orgs = await query(
      `SELECT o.*, om.role, (SELECT COUNT(*) FROM org_members m WHERE m.org_id = o.id) AS member_count,
              (SELECT COUNT(*) FROM projects p WHERE p.org_id = o.id AND p.status = 'active') AS project_count
       FROM orgs o JOIN org_members om ON om.org_id = o.id
       WHERE om.user_id = ? ORDER BY o.name`,
      [req.user.id]
    );
    return res.json({ orgs });
  } catch (e) {
    return next(e);
  }
});

// POST /api/orgs — organisatie aanmaken
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'Naam is verplicht' });

    const slug = await uniqueSlug(name, 'orgs', 'slug');
    const orgId = await transaction(async (conn) => {
      const r = await conn.query('INSERT INTO orgs (name, slug, description, owner_id) VALUES (?, ?, ?, ?)', [
        String(name).trim().slice(0, 128),
        slug,
        description || null,
        req.user.id
      ]);
      const id = Number(r.insertId);
      await conn.query('INSERT INTO org_members (org_id, user_id, role) VALUES (?, ?, ?)', [id, req.user.id, 'owner']);
      return id;
    });

    const org = await queryOne('SELECT * FROM orgs WHERE id = ?', [orgId]);
    return res.status(201).json({ org });
  } catch (e) {
    return next(e);
  }
});

// GET /api/orgs/:orgId — detail + leden + projecten
router.get('/:orgId', requireOrgRole('viewer'), async (req, res, next) => {
  try {
    const orgId = Number(req.params.orgId);
    const org = await queryOne(
      `SELECT o.*, u.full_name AS owner_name, u.username AS owner_username
       FROM orgs o JOIN users u ON u.id = o.owner_id WHERE o.id = ?`,
      [orgId]
    );
    if (!org) return res.status(404).json({ error: 'Organisatie niet gevonden' });

    const members = await query(
      `SELECT u.id, u.email, u.username, u.full_name, u.avatar_color, u.status, om.role, om.joined_at
       FROM org_members om JOIN users u ON u.id = om.user_id
       WHERE om.org_id = ? ORDER BY om.joined_at ASC`,
      [orgId]
    );

    const projects = await query(
      `SELECT p.*, o.name AS org_name,
              (SELECT COUNT(*) FROM boards b WHERE b.project_id = p.id) AS board_count,
              (SELECT COUNT(*) FROM tasks t WHERE t.board_id IN (SELECT id FROM boards WHERE project_id = p.id)) AS task_count
       FROM projects p JOIN orgs o ON o.id = p.org_id
       WHERE p.org_id = ? AND p.status = 'active' ORDER BY p.updated_at DESC`,
      [orgId]
    );

    const myRole = req.orgRole;
    return res.json({ org, members: members.map(publicUser), projects, myRole });
  } catch (e) {
    return next(e);
  }
});

// PATCH /api/orgs/:orgId — bewerken
router.patch('/:orgId', requireOrgRole('admin'), async (req, res, next) => {
  try {
    const { name, description } = req.body || {};
    const sets = [];
    const params = [];
    if (name !== undefined) {
      sets.push('name = ?');
      params.push(String(name).trim().slice(0, 128));
    }
    if (description !== undefined) {
      sets.push('description = ?');
      params.push(description || null);
    }
    if (!sets.length) return res.status(400).json({ error: 'Niets om bij te werken' });
    params.push(Number(req.params.orgId));
    await query(`UPDATE orgs SET ${sets.join(', ')} WHERE id = ?`, params);
    const org = await queryOne('SELECT * FROM orgs WHERE id = ?', [Number(req.params.orgId)]);
    return res.json({ org });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/orgs/:orgId — organisatie verwijderen (owner)
router.delete('/:orgId', requireOrgRole('owner'), async (req, res, next) => {
  try {
    await query('DELETE FROM orgs WHERE id = ?', [Number(req.params.orgId)]);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

// ============================================================================
// Leden
// ============================================================================

// POST /api/orgs/:orgId/members — lid toevoegen op basis van email of username
router.post('/:orgId/members', requireOrgRole('admin'), async (req, res, next) => {
  try {
    const orgId = Number(req.params.orgId);
    const { email, username, role } = req.body || {};
    const target = await queryOne(
      'SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1',
      [email || username, email || username]
    );
    if (!target) return res.status(404).json({ error: 'Gebruiker niet gevonden' });
    if (role && !['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Ongeldige rol' });
    }
    const finalRole = role || 'member';

    const existing = await queryOne('SELECT * FROM org_members WHERE org_id = ? AND user_id = ?', [orgId, target.id]);
    if (existing) {
      await query('UPDATE org_members SET role = ? WHERE org_id = ? AND user_id = ?', [finalRole, orgId, target.id]);
    } else {
      await insert('INSERT INTO org_members (org_id, user_id, role) VALUES (?, ?, ?)', [orgId, target.id, finalRole]);
    }
    return res.status(201).json({ member: publicUser({ ...target, role: finalRole }) });
  } catch (e) {
    return next(e);
  }
});

// PATCH /api/orgs/:orgId/members/:userId — rol aanpassen
router.patch('/:orgId/members/:userId', requireOrgRole('admin'), async (req, res, next) => {
  try {
    const orgId = Number(req.params.orgId);
    const userId = Number(req.params.userId);
    const { role } = req.body || {};
    if (!role || !['owner', 'admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Ongeldige rol' });
    }
    const member = await queryOne('SELECT * FROM org_members WHERE org_id = ? AND user_id = ?', [orgId, userId]);
    if (!member) return res.status(404).json({ error: 'Lid niet gevonden' });

    if (member.role === 'owner' && req.orgRole !== 'owner') {
      return res.status(403).json({ error: 'Alleen de eigenaar kan de eigenaar-rol wijzigen' });
    }
    await query('UPDATE org_members SET role = ? WHERE org_id = ? AND user_id = ?', [role, orgId, userId]);
    return res.json({ ok: true, role });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/orgs/:orgId/members/:userId — lid verwijderen
router.delete('/:orgId/members/:userId', requireOrgRole('admin'), async (req, res, next) => {
  try {
    const orgId = Number(req.params.orgId);
    const userId = Number(req.params.userId);
    const member = await queryOne('SELECT * FROM org_members WHERE org_id = ? AND user_id = ?', [orgId, userId]);
    if (!member) return res.status(404).json({ error: 'Lid niet gevonden' });
    if (member.role === 'owner') {
      return res.status(403).json({ error: 'De eigenaar kan niet verwijderd worden' });
    }
    if (userId === req.user.id && req.orgRole !== 'owner') {
      return res.status(403).json({ error: 'Admin kan zichzelf niet verwijderen' });
    }
    await query('DELETE FROM org_members WHERE org_id = ? AND user_id = ?', [orgId, userId]);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

// ============================================================================
// Uitnodigingen
// ============================================================================

// POST /api/orgs/:orgId/invitations
router.post('/:orgId/invitations', requireOrgRole('admin'), async (req, res, next) => {
  try {
    const orgId = Number(req.params.orgId);
    const { email, role } = req.body || {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Ongeldig e-mailadres' });
    }
    const finalRole = role && ['admin', 'member', 'viewer'].includes(role) ? role : 'member';
    const token = randomToken(24);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const existing = await queryOne(
      "SELECT * FROM invitations WHERE org_id = ? AND email = ? AND status = 'pending'",
      [orgId, email.toLowerCase()]
    );
    if (existing) return res.status(409).json({ error: 'Er is al een openstaande uitnodiging voor dit e-mailadres' });

    const inviteId = await insert(
      'INSERT INTO invitations (org_id, email, role, token, invited_by, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [orgId, email.toLowerCase(), finalRole, token, req.user.id, expiresAt]
    );

    const invite = await queryOne(
      'SELECT i.*, o.name AS org_name FROM invitations i JOIN orgs o ON o.id = i.org_id WHERE i.id = ?',
      [inviteId]
    );
    return res.status(201).json({ invitation: invite });
  } catch (e) {
    return next(e);
  }
});

// GET /api/orgs/:orgId/invitations
router.get('/:orgId/invitations', requireOrgRole('admin'), async (req, res, next) => {
  try {
    const invites = await query(
      'SELECT * FROM invitations WHERE org_id = ? ORDER BY created_at DESC',
      [Number(req.params.orgId)]
    );
    return res.json({ invitations: invites });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/orgs/:orgId/invitations/:inviteId
router.delete('/:orgId/invitations/:inviteId', requireOrgRole('admin'), async (req, res, next) => {
  try {
    await query('DELETE FROM invitations WHERE id = ? AND org_id = ?', [
      Number(req.params.inviteId),
      Number(req.params.orgId)
    ]);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;