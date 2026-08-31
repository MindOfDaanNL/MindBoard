const express = require('express');
const { query, queryOne } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/notifications?page=1&limit=20&unread=1
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const onlyUnread = req.query.unread === '1';

    const where = onlyUnread ? 'WHERE user_id = ? AND is_read = 0' : 'WHERE user_id = ?';
    const total = await queryOne(`SELECT COUNT(*) AS n FROM notifications ${where}`, [req.user.id]);
    const notifications = await query(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );
    const unread = await queryOne(
      'SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    return res.json({ notifications, unread: unread.n, total: total.n, page, limit, pages: Math.max(1, Math.ceil(total.n / limit)) });
  } catch (e) {
    return next(e);
  }
});

// GET /api/notifications/prefs — mijn voorkeuren per type
router.get('/prefs', async (req, res, next) => {
  try {
    const rows = await query('SELECT type, enabled FROM notification_prefs WHERE user_id = ?', [req.user.id]);
    const map = { assignment: true, comment: true, mention: true, info: true };
    for (const r of rows) map[r.type] = !!r.enabled;
    return res.json({ prefs: map });
  } catch (e) {
    return next(e);
  }
});

// PATCH /api/notifications/prefs — voorkeuren bijwerken
router.patch('/prefs', async (req, res, next) => {
  try {
    const body = req.body || {};
    const types = ['assignment', 'comment', 'mention', 'info'];
    const sets = [];
    const params = [];
    for (const type of types) {
      if (body[type] !== undefined) {
        sets.push(type);
        params.push(body[type] ? 1 : 0);
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'Niets om bij te werken' });
    for (let i = 0; i < sets.length; i++) {
      await query(
        'INSERT INTO notification_prefs (user_id, type, enabled) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE enabled = VALUES(enabled)',
        [req.user.id, sets[i], params[i]]
      );
    }
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

// POST /api/notifications/read-all
router.post('/read-all', async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

// POST /api/notifications/:id/read
router.post('/:id/read', async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [
      Number(req.params.id),
      req.user.id
    ]);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [Number(req.params.id), req.user.id]);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;