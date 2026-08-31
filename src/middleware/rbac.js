const { queryOne } = require('../db');

const ROLE_RANK = { viewer: 0, member: 1, admin: 2, owner: 3 };

async function getOrgRole(userId, orgId) {
  const row = await queryOne('SELECT role FROM org_members WHERE org_id = ? AND user_id = ?', [orgId, userId]);
  return row ? row.role : null;
}

async function getProjectRole(userId, projectId) {
  const row = await queryOne(
    `SELECT p.org_id, o.owner_id, om.role AS org_role, pm.role AS project_role
     FROM projects p
     JOIN orgs o ON o.id = p.org_id
     LEFT JOIN org_members om ON om.org_id = p.org_id AND om.user_id = ?
     LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
     WHERE p.id = ?`,
    [userId, userId, projectId]
  );
  if (!row) return null;
  if (row.org_role === 'owner' || row.org_role === 'admin') return row.org_role;
  if (row.project_role) return row.project_role;
  return null;
}

// Minimale rol die nodig is; global admin passeert altijd (maar krijgt wel zijn org-rol mee)
function requireOrgRole(minRole) {
  return async (req, res, next) => {
    const orgId = Number(req.params.orgId) || Number(req.params.id) || Number(req.query.orgId);
    if (!orgId) return res.status(400).json({ error: 'orgId ontbreekt' });
    const role = await getOrgRole(req.user.id, orgId);
    if (req.user.role === 'admin') {
      req.orgRole = role || 'admin';
      return next();
    }
    if (!role) return res.status(403).json({ error: 'Geen lid van deze organisatie' });
    if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
      return res.status(403).json({ error: `Minimaal rol '${minRole}' vereist` });
    }
    req.orgRole = role;
    return next();
  };
}

async function requireProjectRoleMiddleware(req, res, next, minRole) {
  const projectId = Number(req.params.projectId) || Number(req.params.id);
  if (!projectId) return res.status(400).json({ error: 'projectId ontbreekt' });
  const role = await getProjectRole(req.user.id, projectId);
  if (req.user.role === 'admin') {
    req.projectRole = role || 'admin';
    return next();
  }
  if (!role) return res.status(403).json({ error: 'Geen toegang tot dit project' });
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    return res.status(403).json({ error: `Minimaal rol '${minRole}' vereist` });
  }
  req.projectRole = role;
  return next();
}

const requireProjectRole = (minRole) => (req, res, next) => requireProjectRoleMiddleware(req, res, next, minRole);

async function canAccessProject(userId, projectId) {
  if (!projectId) return false;
  const role = await getProjectRole(userId, projectId);
  return role !== null;
}

async function getOrgOfProject(projectId) {
  const row = await queryOne('SELECT org_id FROM projects WHERE id = ?', [projectId]);
  return row ? row.org_id : null;
}

async function logActivity(orgId, userId, action, entityType, entityId, entityName, metadata) {
  const { query } = require('../db');
  try {
    await query(
      `INSERT INTO activity_log (org_id, user_id, action, entity_type, entity_id, entity_name, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orgId, userId, action, entityType || null, entityId || null, entityName || null, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (e) {
    console.error('activiteitenlog fout:', e.message);
  }
}

async function notify(userId, type, title, body, link) {
  const { query } = require('../db');
  try {
    const pref = await queryOne('SELECT enabled FROM notification_prefs WHERE user_id = ? AND type = ?', [userId, type]);
    if (pref && !pref.enabled) return;
    await query(
      'INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, body || null, link || null]
    );
  } catch (e) {
    console.error('notificatie fout:', e.message);
  }
}

module.exports = {
  ROLE_RANK,
  getOrgRole,
  getProjectRole,
  requireOrgRole,
  requireProjectRole,
  canAccessProject,
  getOrgOfProject,
  logActivity,
  notify
};