const express = require('express');
const { query, queryOne, insert, transaction } = require('../db');
const { authenticate } = require('../middleware/auth');
const { getProjectRole, getOrgOfProject, logActivity, notify } = require('../middleware/rbac');
const { cleanTagName } = require('../utils');

const router = express.Router({ mergeParams: true });
router.use(authenticate);

const { computeNextAt } = require('../recurring');

function canEdit(role, user) {
  if (user && user.role === 'admin') return true;
  return ['owner', 'admin', 'member'].includes(role);
}

async function ensureTaskAccess(req, res, next) {
  const taskId = Number(req.params.taskId || req.params.id);
  const task = await queryOne(
    `SELECT t.*, b.project_id, c.name AS column_name,
            a.full_name AS assignee_name, a.username AS assignee_username, a.avatar_color AS assignee_color, a.avatar_url AS assignee_avatar_url,
            cr.full_name AS creator_name, cr.username AS creator_username
     FROM tasks t
     JOIN columns c ON c.id = t.column_id
     JOIN boards b ON b.id = t.board_id
     LEFT JOIN users a ON a.id = t.assignee_id
     LEFT JOIN users cr ON cr.id = t.created_by
     WHERE t.id = ?`,
    [taskId]
  );
  if (!task) return res.status(404).json({ error: 'Taak niet gevonden' });
  const role = await getProjectRole(req.user.id, task.project_id);
  if (!role) return res.status(403).json({ error: 'Geen toegang tot deze taak' });
  req.task = task;
  req.taskRole = role;
  return next();
}

// GET /api/tasks/:taskId — taak detail met comments
router.get('/:taskId', ensureTaskAccess, async (req, res, next) => {
  try {
    const taskId = Number(req.params.taskId);
    const comments = await query(
      `SELECT c.*, u.username, u.full_name, u.avatar_color, u.avatar_url FROM comments c
       JOIN users u ON u.id = c.user_id WHERE c.task_id = ? ORDER BY c.created_at ASC`,
      [taskId]
    );
    const tags = await query(
      'SELECT tg.* FROM task_tags tt JOIN tags tg ON tg.id = tt.tag_id WHERE tt.task_id = ?',
      [taskId]
    );
    const checklists = await query(
      `SELECT cl.*, 
              (SELECT COUNT(*) FROM checklist_items ci WHERE ci.checklist_id = cl.id) AS total,
              (SELECT COUNT(*) FROM checklist_items ci WHERE ci.checklist_id = cl.id AND ci.is_done = 1) AS done
       FROM checklists cl WHERE cl.task_id = ? ORDER BY cl.position ASC, cl.id ASC`,
      [taskId]
    );
    const items = await query(
      'SELECT * FROM checklist_items WHERE task_id = ? ORDER BY checklist_id ASC, position ASC, id ASC',
      [taskId]
    );
    const board = await queryOne(
      'SELECT b.*, p.name AS project_name, p.org_id FROM boards b JOIN projects p ON p.id = b.project_id WHERE b.id = ?',
      [req.task.board_id]
    );
    const columns = await query('SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC', [req.task.board_id]);
    const members = await query(
      `SELECT u.id, u.username, u.full_name, u.avatar_color, u.avatar_url FROM users u
       JOIN org_members om ON om.user_id = u.id AND om.org_id = ? ORDER BY u.full_name`,
      [board.org_id]
    );

    return res.json({
      task: { ...req.task, tags },
      checklists,
      checklistItems: items,
      comments,
      board: { id: board.id, name: board.name, projectId: board.project_id, projectName: board.project_name },
      columns,
      members,
      myRole: req.taskRole
    });
  } catch (e) {
    return next(e);
  }
});

// POST /api/boards/:boardId/tasks (of /api/tasks?boardId=...) — taak aanmaken
router.post('/', async (req, res, next) => {
  try {
    const boardId = req.params.boardId || req.query.boardId;
    if (!boardId) return res.status(400).json({ error: 'boardId is verplicht' });
    const { title, description, priority, dueDate, assigneeId, columnId, tags, recurrenceRule, recurrenceInterval, recurrenceEndDate } = req.body || {};
    if (!title || !title.trim()) return res.status(400).json({ error: 'Titel is verplicht' });

    const board = await queryOne('SELECT * FROM boards WHERE id = ?', [Number(boardId)]);
    if (!board) return res.status(404).json({ error: 'Bord niet gevonden' });
    const role = await getProjectRole(req.user.id, board.project_id);
    if (!canEdit(role, req.user)) return res.status(403).json({ error: 'Alleen admin/member mag taken aanmaken' });

    const cols = await query('SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC', [boardId]);
    if (!cols.length) return res.status(400).json({ error: 'Bord heeft geen kolommen' });
    const col = cols.find((c) => c.id === Number(columnId)) || cols[0];
    if (col.wip_limit !== null && col.wip_limit !== undefined && Number(col.wip_limit) > 0) {
      const inCol = await queryOne('SELECT COUNT(*) AS n FROM tasks WHERE column_id = ?', [col.id]);
      if (inCol.n >= Number(col.wip_limit)) {
        return res.status(409).json({ error: `WIP-limiet bereikt (${col.wip_limit}) in "${col.name}"` });
      }
    }

    const pos = await queryOne('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM tasks WHERE column_id = ?', [col.id]);

    const taskId = await transaction(async (conn) => {
      const rule = ['daily', 'weekly', 'monthly'].includes(recurrenceRule) ? recurrenceRule : 'none';
      const interval = Math.max(1, Number(recurrenceInterval) || 1);
      const nextAt = computeNextAt(dueDate, rule, interval);
      const r = await conn.query(
        `INSERT INTO tasks (board_id, column_id, title, description, priority, due_date, position, assignee_id, created_by,
           recurrence_rule, recurrence_interval, recurrence_next_at, recurrence_end_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(boardId),
          col.id,
          String(title).trim().slice(0, 255),
          description || null,
          ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
          dueDate || null,
          pos.p,
          assigneeId || null,
          req.user.id,
          rule,
          interval,
          nextAt,
          recurrenceEndDate || null
        ]
      );
      const id = Number(r.insertId);
      if (Array.isArray(tags)) {
        for (const t of tags.slice(0, 5)) {
          const name = cleanTagName(t);
          if (!name) continue;
          await conn.query('INSERT IGNORE INTO tags (name) VALUES (?)', [name]);
          const tag = await conn.query('SELECT id FROM tags WHERE name = ?', [name]);
          await conn.query('INSERT IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)', [id, tag[0].id]);
        }
      }
      return id;
    });

    const orgId = await getOrgOfProject(board.project_id);
    await logActivity(orgId, req.user.id, 'task.created', 'task', taskId, String(title).trim().slice(0, 100));
    if (assigneeId && assigneeId !== req.user.id) {
      await notify(assigneeId, 'assignment', 'Nieuwe taak toegewezen', `Je hebt "${String(title).trim()}" toegewezen gekregen`, `/board/${boardId}`);
    }

    const task = await queryOne('SELECT * FROM tasks WHERE id = ?', [taskId]);
    return res.status(201).json({ task });
  } catch (e) {
    return next(e);
  }
});

// PATCH /api/tasks/:taskId — taak bewerken
router.patch('/:taskId', ensureTaskAccess, async (req, res, next) => {
  try {
    if (!canEdit(req.taskRole, req.user)) return res.status(403).json({ error: 'Alleen admin/member mag taken bewerken' });
    const { title, description, priority, dueDate, assigneeId, tags, recurrenceRule, recurrenceInterval, recurrenceEndDate } = req.body || {};
    const sets = [];
    const params = [];
    if (title !== undefined) { sets.push('title = ?'); params.push(String(title).trim().slice(0, 255)); }
    if (description !== undefined) { sets.push('description = ?'); params.push(description || null); }
    if (priority !== undefined) {
      if (!['low', 'medium', 'high', 'urgent'].includes(priority)) return res.status(400).json({ error: 'Ongeldige prioriteit' });
      sets.push('priority = ?'); params.push(priority);
    }
    if (dueDate !== undefined) { sets.push('due_date = ?'); params.push(dueDate || null); }
    if (assigneeId !== undefined) { sets.push('assignee_id = ?'); params.push(assigneeId || null); }

    if (recurrenceRule !== undefined) {
      const rule = ['daily', 'weekly', 'monthly'].includes(recurrenceRule) ? recurrenceRule : 'none';
      sets.push('recurrence_rule = ?'); params.push(rule);
      if (rule === 'none') {
        sets.push('recurrence_next_at = NULL');
      } else {
        const interval = Math.max(1, Number(recurrenceInterval) || req.task.recurrence_interval || 1);
        const due = dueDate !== undefined ? (dueDate || null) : req.task.due_date;
        sets.push('recurrence_interval = ?'); params.push(interval);
        sets.push('recurrence_next_at = ?'); params.push(computeNextAt(due, rule, interval));
      }
    } else if (recurrenceInterval !== undefined) {
      const interval = Math.max(1, Number(recurrenceInterval) || 1);
      sets.push('recurrence_interval = ?'); params.push(interval);
      if (req.task.recurrence_rule && req.task.recurrence_rule !== 'none') {
        const due = dueDate !== undefined ? (dueDate || null) : req.task.due_date;
        sets.push('recurrence_next_at = ?'); params.push(computeNextAt(due, req.task.recurrence_rule, interval));
      }
    } else if (dueDate !== undefined && req.task.recurrence_rule && req.task.recurrence_rule !== 'none') {
      const interval = req.task.recurrence_interval || 1;
      sets.push('recurrence_next_at = ?'); params.push(computeNextAt(dueDate, req.task.recurrence_rule, interval));
    }
    if (recurrenceEndDate !== undefined) { sets.push('recurrence_end_date = ?'); params.push(recurrenceEndDate || null); }

    if (!sets.length && tags === undefined) return res.status(400).json({ error: 'Niets om bij te werken' });
    params.push(Number(req.params.taskId));

    const taskId = Number(req.params.taskId);
    await transaction(async (conn) => {
      if (sets.length) await conn.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`, params);
      if (tags !== undefined) {
        await conn.query('DELETE FROM task_tags WHERE task_id = ?', [taskId]);
        for (const t of tags.slice(0, 5)) {
          const name = cleanTagName(t);
          if (!name) continue;
          await conn.query('INSERT IGNORE INTO tags (name) VALUES (?)', [name]);
          const tag = await conn.query('SELECT id FROM tags WHERE name = ?', [name]);
          await conn.query('INSERT IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)', [taskId, tag[0].id]);
        }
      }
    });

    if (assigneeId && assigneeId !== req.user.id) {
      const orgId = await getOrgOfProject(req.task.project_id);
      await notify(assigneeId, 'assignment', 'Taak toegewezen', `Je hebt "${req.task.title}" toegewezen gekregen`, `/board/${req.task.board_id}`);
      await logActivity(orgId, req.user.id, 'task.assigned', 'task', taskId, req.task.title, { assigneeId });
    }

    const task = await queryOne('SELECT * FROM tasks WHERE id = ?', [taskId]);
    return res.json({ task });
  } catch (e) {
    return next(e);
  }
});

// POST /api/tasks/:taskId/move — taak verplaatsen naar kolom
router.post('/:taskId/move', ensureTaskAccess, async (req, res, next) => {
  try {
    if (!canEdit(req.taskRole, req.user)) return res.status(403).json({ error: 'Alleen admin/member mag taken verplaatsen' });
    const { columnId, position } = req.body || {};
    if (!columnId) return res.status(400).json({ error: 'columnId is verplicht' });

    const col = await queryOne(
      'SELECT * FROM columns WHERE id = ? AND board_id = ?',
      [Number(columnId), req.task.board_id]
    );
    if (!col) return res.status(404).json({ error: 'Kolom niet gevonden op dit bord' });

    const taskId = Number(req.params.taskId);
    const oldColumnId = req.task.column_id;

    if (col.id !== oldColumnId && col.wip_limit !== null && col.wip_limit !== undefined && Number(col.wip_limit) > 0) {
      const inTarget = await queryOne('SELECT COUNT(*) AS n FROM tasks WHERE column_id = ? AND id <> ?', [col.id, taskId]);
      if (inTarget.n >= Number(col.wip_limit)) {
        return res.status(409).json({ error: `WIP-limiet bereikt (${col.wip_limit}) in "${col.name}"` });
      }
    }

    await transaction(async (conn) => {
      // de positie uit de oude kolom halen
      await conn.query('UPDATE tasks SET position = position - 1 WHERE column_id = ? AND position > ?', [
        oldColumnId,
        req.task.position
      ]);
      if (col.id === oldColumnId && position !== undefined) {
        // reorder binnen dezelfde kolom
        await conn.query('UPDATE tasks SET position = position + 1 WHERE column_id = ? AND position >= ? AND id <> ?', [
          col.id,
          position,
          taskId
        ]);
        await conn.query('UPDATE tasks SET position = ?, column_id = ? WHERE id = ?', [position, col.id, taskId]);
      } else if (col.id !== oldColumnId) {
        const maxPos = await conn.query('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM tasks WHERE column_id = ?', [col.id]);
        const newPos = position !== undefined ? position : maxPos[0].p;
        await conn.query('UPDATE tasks SET position = position + 1 WHERE column_id = ? AND position >= ?', [col.id, newPos]);
        await conn.query('UPDATE tasks SET position = ?, column_id = ? WHERE id = ?', [newPos, col.id, taskId]);
      }
    });

    const orgId = await getOrgOfProject(req.task.project_id);
    await logActivity(orgId, req.user.id, 'task.moved', 'task', taskId, req.task.title, {
      fromColumn: req.task.column_name,
      toColumn: col.name
    });

    const task = await queryOne('SELECT * FROM tasks WHERE id = ?', [taskId]);
    return res.json({ task });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/tasks/:taskId
router.delete('/:taskId', ensureTaskAccess, async (req, res, next) => {
  try {
    if (!canEdit(req.taskRole, req.user)) return res.status(403).json({ error: 'Alleen admin/member mag taken verwijderen' });
    const taskId = Number(req.params.taskId);
    await transaction(async (conn) => {
      await conn.query('UPDATE tasks SET position = position - 1 WHERE column_id = ? AND position > ?', [
        req.task.column_id,
        req.task.position
      ]);
      await conn.query('DELETE FROM tasks WHERE id = ?', [taskId]);
    });
    const orgId = await getOrgOfProject(req.task.project_id);
    await logActivity(orgId, req.user.id, 'task.deleted', 'task', taskId, req.task.title);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

// POST /api/tasks/:taskId/comments
router.post('/:taskId/comments', ensureTaskAccess, async (req, res, next) => {
  try {
    const { body } = req.body || {};
    if (!body || !body.trim()) return res.status(400).json({ error: 'Comment mag niet leeg zijn' });
    const commentId = await insert('INSERT INTO comments (task_id, user_id, body) VALUES (?, ?, ?)', [
      Number(req.params.taskId),
      req.user.id,
      String(body).trim().slice(0, 5000)
    ]);
    const comment = await queryOne(
      'SELECT c.*, u.username, u.full_name, u.avatar_color FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?',
      [commentId]
    );
    const orgId = await getOrgOfProject(req.task.project_id);
    await logActivity(orgId, req.user.id, 'task.commented', 'task', Number(req.params.taskId), req.task.title);
    if (req.task.assignee_id && req.task.assignee_id !== req.user.id) {
      await notify(req.task.assignee_id, 'comment', 'Nieuwe reactie', `${req.user.full_name || req.user.username} reageerde op "${req.task.title}"`, `/board/${req.task.board_id}`);
    }
    const mentionMatch = String(body).match(/@([a-zA-Z0-9_.]{3,32})/g);
    if (mentionMatch) {
      const orgMembers = await query(
        'SELECT u.id, u.username FROM users u JOIN org_members om ON om.user_id = u.id AND om.org_id = ?',
        [orgId]
      );
      const targets = orgMembers.filter((u) => mentionMatch.includes('@' + u.username) && u.id !== req.user.id);
      for (const u of targets) {
        await notify(u.id, 'mention', 'Je bent vermeld', `${req.user.full_name || req.user.username} vermeldde @${u.username} in "${req.task.title}"`, `/board/${req.task.board_id}`);
      }
    }
    return res.status(201).json({ comment });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/comments/:commentId
router.delete('/comments/:commentId', async (req, res, next) => {
  try {
    const commentId = Number(req.params.commentId);
    const comment = await queryOne(
      `SELECT c.*, b.project_id FROM comments c
       JOIN tasks t ON t.id = c.task_id
       JOIN boards b ON b.id = t.board_id
       WHERE c.id = ?`,
      [commentId]
    );
    if (!comment) return res.status(404).json({ error: 'Comment niet gevonden' });
    const role = await getProjectRole(req.user.id, comment.project_id);
    if (comment.user_id !== req.user.id && !['admin'].includes(role)) {
      return res.status(403).json({ error: 'Geen rechten om dit comment te verwijderen' });
    }
    await query('DELETE FROM comments WHERE id = ?', [commentId]);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

// ---------------------------------------------------------------------------
// Checklists (subtaken)
// ---------------------------------------------------------------------------

// POST /api/tasks/:taskId/checklists — nieuwe checklist
router.post('/:taskId/checklists', ensureTaskAccess, async (req, res, next) => {
  try {
    if (!canEdit(req.taskRole, req.user)) return res.status(403).json({ error: 'Alleen admin/member mag checklists aanmaken' });
    const { title } = req.body || {};
    if (!title || !title.trim()) return res.status(400).json({ error: 'Titel is verplicht' });
    const pos = await queryOne('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM checklists WHERE task_id = ?', [req.task.id]);
    const id = await insert('INSERT INTO checklists (task_id, title, position) VALUES (?, ?, ?)', [
      req.task.id,
      String(title).trim().slice(0, 255),
      pos.p
    ]);
    const checklist = await queryOne('SELECT * FROM checklists WHERE id = ?', [id]);
    return res.status(201).json({ checklist });
  } catch (e) {
    return next(e);
  }
});

// POST /api/tasks/:taskId/checklists/:checklistId/items — item toevoegen
router.post('/:taskId/checklists/:checklistId/items', ensureTaskAccess, async (req, res, next) => {
  try {
    if (!canEdit(req.taskRole, req.user)) return res.status(403).json({ error: 'Alleen admin/member mag items toevoegen' });
    const checklistId = Number(req.params.checklistId);
    const checklist = await queryOne('SELECT * FROM checklists WHERE id = ? AND task_id = ?', [checklistId, req.task.id]);
    if (!checklist) return res.status(404).json({ error: 'Checklist niet gevonden' });
    const { title } = req.body || {};
    if (!title || !title.trim()) return res.status(400).json({ error: 'Titel is verplicht' });
    const pos = await queryOne('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM checklist_items WHERE checklist_id = ?', [checklistId]);
    const id = await insert('INSERT INTO checklist_items (checklist_id, task_id, title, position) VALUES (?, ?, ?, ?)', [
      checklistId,
      req.task.id,
      String(title).trim().slice(0, 255),
      pos.p
    ]);
    const item = await queryOne('SELECT * FROM checklist_items WHERE id = ?', [id]);
    return res.status(201).json({ item });
  } catch (e) {
    return next(e);
  }
});

// PATCH /api/tasks/:taskId/items/:itemId — titel of status wijzigen
router.patch('/:taskId/items/:itemId', ensureTaskAccess, async (req, res, next) => {
  try {
    if (!canEdit(req.taskRole, req.user)) return res.status(403).json({ error: 'Alleen admin/member mag items bewerken' });
    const itemId = Number(req.params.itemId);
    const item = await queryOne('SELECT * FROM checklist_items WHERE id = ? AND task_id = ?', [itemId, req.task.id]);
    if (!item) return res.status(404).json({ error: 'Item niet gevonden' });

    const { title, isDone } = req.body || {};
    const sets = [];
    const params = [];
    if (title !== undefined) { sets.push('title = ?'); params.push(String(title).trim().slice(0, 255)); }
    if (isDone !== undefined) { sets.push('is_done = ?'); params.push(isDone ? 1 : 0); }
    if (!sets.length) return res.status(400).json({ error: 'Niets om bij te werken' });
    params.push(itemId);
    await query(`UPDATE checklist_items SET ${sets.join(', ')} WHERE id = ?`, params);

    // Taak afronden als alle items klaar zijn (optioneel loggen)
    const orgId = await getOrgOfProject(req.task.project_id);
    await logActivity(orgId, req.user.id, 'task.checklist', 'task', req.task.id, req.task.title, { itemId });
    const updated = await queryOne('SELECT * FROM checklist_items WHERE id = ?', [itemId]);
    return res.json({ item: updated });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/tasks/:taskId/items/:itemId — item verwijderen
router.delete('/:taskId/items/:itemId', ensureTaskAccess, async (req, res, next) => {
  try {
    if (!canEdit(req.taskRole, req.user)) return res.status(403).json({ error: 'Alleen admin/member mag items verwijderen' });
    await query('DELETE FROM checklist_items WHERE id = ? AND task_id = ?', [Number(req.params.itemId), req.task.id]);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/tasks/:taskId/checklists/:checklistId — checklist verwijderen
router.delete('/:taskId/checklists/:checklistId', ensureTaskAccess, async (req, res, next) => {
  try {
    if (!canEdit(req.taskRole, req.user)) return res.status(403).json({ error: 'Alleen admin/member mag checklists verwijderen' });
    await query('DELETE FROM checklists WHERE id = ? AND task_id = ?', [Number(req.params.checklistId), req.task.id]);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;