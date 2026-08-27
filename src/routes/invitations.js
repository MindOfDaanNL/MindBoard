const express = require('express');
const { queryOne, transaction } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// POST /api/invitations/:token/accept — uitnodiging accepteren
router.post('/:token/accept', async (req, res, next) => {
  try {
    const { token } = req.params;
    const invite = await queryOne(
      `SELECT i.*, o.name AS org_name FROM invitations i JOIN orgs o ON o.id = i.org_id
       WHERE i.token = ? AND i.status = 'pending'`,
      [token]
    );
    if (!invite) return res.status(404).json({ error: 'Uitnodiging niet gevonden of al gebruikt' });
    if (new Date(invite.expires_at) < new Date()) {
      await queryOne('UPDATE invitations SET status = ? WHERE id = ?', ['expired', invite.id]);
      return res.status(410).json({ error: 'Uitnodiging is verlopen' });
    }
    if (invite.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ error: 'Deze uitnodiging is niet voor jouw account' });
    }

    await transaction(async (conn) => {
      await conn.query('INSERT IGNORE INTO org_members (org_id, user_id, role) VALUES (?, ?, ?)', [
        invite.org_id,
        req.user.id,
        invite.role
      ]);
      await conn.query('UPDATE invitations SET status = ? WHERE id = ?', ['accepted', invite.id]);
    });

    return res.json({ ok: true, orgId: invite.org_id, orgName: invite.org_name });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;