const express = require('express');
const { query, queryOne, insert, transaction } = require('../db');
const { authenticate } = require('../middleware/auth');
const { requireProjectRole, requireOrgRole, getProjectRole } = require('../middleware/rbac');

const router = express.Router({ mergeParams: true });
const columnsRouter = express.Router({ mergeParams: true });
router.use(authenticate);
columnsRouter.use(authenticate);

// ---------------------------------------------------------------------------
// Borden
// ---------------------------------------------------------------------------

// GET /api/boards/:boardId — volledig bord: kolommen + taken (+ meta)
router.get('/:boardId', async (req, res, next) => {
  try {
    const boardId = Number(req.params.boardId);
    const board = await queryOne(
      `SELECT b.*, p.name AS project_name, p.org_id, p.color AS project_color, p.icon AS project_icon
       FROM boards b JOIN projects p ON p.id = b.project_id WHERE b.id = ?`,
      [boardId]
    );
    if (!board) return res.status(404).json({ error: 'Bord niet gevonden' });

    const role = await getProjectRole(req.user.id, board.project_id);
    if (!role) return res.status(403).json({ error: 'Geen toegang tot dit bord' });

    const columns = await query('SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC, id ASC', [boardId]);

    const tasks = await query(
      `SELECT t.*, a.full_name AS assignee_name, a.username AS assignee_username, a.avatar_color AS assignee_color, a.avatar_url AS assignee_avatar_url,
              c.name AS column_name, c.color AS column_color
       FROM tasks t
       JOIN columns c ON c.id = t.column_id
       LEFT JOIN users a ON a.id = t.assignee_id
       WHERE t.board_id = ?
       ORDER BY t.position ASC, t.created_at DESC`,
      [boardId]
    );

    const tags = await query(
      `SELECT tt.task_id, tg.id, tg.name FROM task_tags tt JOIN tags tg ON tg.id = tt.tag_id
       WHERE tt.task_id IN (SELECT id FROM tasks WHERE board_id = ?) ORDER BY tg.name`,
      [boardId]
    );

    const tagMap = {};
    for (const t of tags) {
      (tagMap[t.task_id] = tagMap[t.task_id] || []).push({ id: t.id, name: t.name });
    }

    const users = await query(
      `SELECT u.id, u.username, u.full_name, u.avatar_color, u.avatar_url FROM users u
       JOIN org_members om ON om.user_id = u.id AND om.org_id = ?
       ORDER BY u.full_name ASC`,
      [board.org_id]
    );

    return res.json({
      board,
      columns: columns.map((c) => ({ ...c, taskIds: [] })),
      tasks: tasks.map((t) => ({ ...t, tags: tagMap[t.id] || [] })),
      members: users.map((u) => ({ id: u.id, username: u.username, fullName: u.full_name, avatarColor: u.avatar_color, avatarUrl: u.avatar_url })),
      myRole: role
    });
  } catch (e) {
    return next(e);
  }
});

// POST /api/projects/:projectId/boards (of /api/boards?projectId=) — nieuw bord
router.post('/', async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.query.projectId;
    if (!projectId) return res.status(400).json({ error: 'projectId is verplicht' });
    const role = await getProjectRole(req.user.id, Number(projectId));
    if (!role) return res.status(403).json({ error: 'Geen toegang tot dit project' });
    if (!['owner', 'admin', 'member'].includes(role)) return res.status(403).json({ error: 'Alleen admin/member mag borden aanmaken' });

    const { name } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'Naam is verplicht' });
    const pos = await queryOne('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM boards WHERE project_id = ?', [projectId]);
    const boardId = await transaction(async (conn) => {
      const r = await conn.query('INSERT INTO boards (project_id, name, position) VALUES (?, ?, ?)', [
        Number(projectId),
        String(name).trim().slice(0, 128),
        pos.p
      ]);
      const id = Number(r.insertId);
      // Standaard kolommen aanmaken zodat het bord direct bruikbaar is
      const cols = [
        ['📋 Te doen', '#e2e8f0'],
        ['🔨 Bezig', '#fbbf24'],
        ['🔎 Review', '#38bdf8'],
        ['✅ Klaar', '#4ade80']
      ];
      for (let i = 0; i < cols.length; i++) {
        await conn.query('INSERT INTO columns (board_id, name, color, position) VALUES (?, ?, ?, ?)', [
          id,
          cols[i][0],
          cols[i][1],
          i
        ]);
      }
      return id;
    });
    return res.status(201).json({ board: { id: boardId } });
  } catch (e) {
    return next(e);
  }
});

// PATCH /api/boards/:boardId
router.patch('/:boardId', async (req, res, next) => {
  try {
    const boardId = Number(req.params.boardId);
    const board = await queryOne('SELECT * FROM boards WHERE id = ?', [boardId]);
    if (!board) return res.status(404).json({ error: 'Bord niet gevonden' });
    const role = await getProjectRole(req.user.id, board.project_id);
    if (!['owner', 'admin', 'member'].includes(role)) return res.status(403).json({ error: 'Geen rechten' });

    const { name } = req.body || {};
    if (name === undefined) return res.status(400).json({ error: 'Niets om bij te werken' });
    await query('UPDATE boards SET name = ? WHERE id = ?', [String(name).trim().slice(0, 128), boardId]);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/boards/:boardId
router.delete('/:boardId', async (req, res, next) => {
  try {
    const boardId = Number(req.params.boardId);
    const board = await queryOne('SELECT * FROM boards WHERE id = ?', [boardId]);
    if (!board) return res.status(404).json({ error: 'Bord niet gevonden' });
    const role = await getProjectRole(req.user.id, board.project_id);
    if (!['owner', 'admin', 'member'].includes(role)) return res.status(403).json({ error: 'Geen rechten' });
    await query('DELETE FROM boards WHERE id = ?', [boardId]);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

// ---------------------------------------------------------------------------
// Kolommen
// ---------------------------------------------------------------------------

// POST /api/boards/:boardId/columns
router.post('/:boardId/columns', async (req, res, next) => {
  try {
    const boardId = Number(req.params.boardId);
    const board = await queryOne('SELECT * FROM boards WHERE id = ?', [boardId]);
    if (!board) return res.status(404).json({ error: 'Bord niet gevonden' });
    const role = await getProjectRole(req.user.id, board.project_id);
    if (!['owner', 'admin', 'member'].includes(role)) return res.status(403).json({ error: 'Geen rechten' });

    const { name, color } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'Naam is verplicht' });
    const pos = await queryOne('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM columns WHERE board_id = ?', [boardId]);
    const columnId = await insert('INSERT INTO columns (board_id, name, color, position) VALUES (?, ?, ?, ?)', [
      boardId,
      String(name).trim().slice(0, 128),
      color || '#e2e8f0',
      pos.p
    ]);
    return res.status(201).json({ column: { id: columnId } });
  } catch (e) {
    return next(e);
  }
});

// PATCH /api/columns/:columnId
columnsRouter.patch('/:columnId', async (req, res, next) => {
  try {
    const columnId = Number(req.params.columnId);
    const column = await queryOne(
      `SELECT c.*, b.project_id FROM columns c JOIN boards b ON b.id = c.board_id WHERE c.id = ?`,
      [columnId]
    );
    if (!column) return res.status(404).json({ error: 'Kolom niet gevonden' });
    const role = await getProjectRole(req.user.id, column.project_id);
    if (!['owner', 'admin', 'member'].includes(role)) return res.status(403).json({ error: 'Geen rechten' });

    const { name, color, wipLimit } = req.body || {};
    const sets = [];
    const params = [];
    if (name !== undefined) { sets.push('name = ?'); params.push(String(name).trim().slice(0, 128)); }
    if (color !== undefined) { sets.push('color = ?'); params.push(color); }
    if (wipLimit !== undefined) {
      const wip = wipLimit === null || wipLimit === '' ? null : Number(wipLimit);
      sets.push('wip_limit = ?');
      params.push(Number.isFinite(wip) ? wip : null);
    }
    if (!sets.length) return res.status(400).json({ error: 'Niets om bij te werken' });
    params.push(columnId);
    await query(`UPDATE columns SET ${sets.join(', ')} WHERE id = ?`, params);
    const updated = await queryOne('SELECT * FROM columns WHERE id = ?', [columnId]);
    return res.json({ column: updated });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/columns/:columnId
columnsRouter.delete('/:columnId', async (req, res, next) => {
  try {
    const columnId = Number(req.params.columnId);
    const column = await queryOne(
      `SELECT c.*, b.project_id FROM columns c JOIN boards b ON b.id = c.board_id WHERE c.id = ?`,
      [columnId]
    );
    if (!column) return res.status(404).json({ error: 'Kolom niet gevonden' });
    const role = await getProjectRole(req.user.id, column.project_id);
    if (!['owner', 'admin', 'member'].includes(role)) return res.status(403).json({ error: 'Geen rechten' });
    const count = await queryOne('SELECT COUNT(*) AS n FROM columns WHERE board_id = ?', [column.board_id]);
    if (count.n <= 1) return res.status(400).json({ error: 'Een bord heeft minimaal 1 kolom nodig' });
    await query('DELETE FROM columns WHERE id = ?', [columnId]);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

// POST /api/boards/:boardId/columns/reorder
router.post('/:boardId/columns/reorder', async (req, res, next) => {
  try {
    const boardId = Number(req.params.boardId);
    const board = await queryOne('SELECT * FROM boards WHERE id = ?', [boardId]);
    if (!board) return res.status(404).json({ error: 'Bord niet gevonden' });
    const role = await getProjectRole(req.user.id, board.project_id);
    if (!['owner', 'admin', 'member'].includes(role)) return res.status(403).json({ error: 'Geen rechten' });

    const { columnIds } = req.body || {};
    if (!Array.isArray(columnIds) || !columnIds.length) return res.status(400).json({ error: 'columnIds array verplicht' });

    await transaction(async (conn) => {
      for (let i = 0; i < columnIds.length; i++) {
        await conn.query('UPDATE columns SET position = ? WHERE id = ? AND board_id = ?', [i, columnIds[i], boardId]);
      }
    });
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
module.exports.columnsRouter = columnsRouter;