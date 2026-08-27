const express = require('express');
const crypto = require('crypto');
const { query, queryOne, insert, transaction } = require('../db');
const { signAccessToken, authenticate } = require('../middleware/auth');
const { hashPassword, verifyPassword, randomToken, sha256, publicUser, slugify, uniqueSlug } = require('../utils');
const { REFRESH_TOKEN_TTL_DAYS } = require('../config');

const router = express.Router();

function setRefreshCookie(res, token, ttlDays) {
  res.cookie('mb_refresh', token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: ttlDays * 24 * 60 * 60 * 1000,
    path: '/api/auth'
  });
}

function clearRefreshCookie(res) {
  res.clearCookie('mb_refresh', { path: '/api/auth' });
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, username, password, fullName } = req.body || {};
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'email, username en password zijn verplicht' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Ongeldig e-mailadres' });
    }
    if (!/^[a-zA-Z0-9_.]{3,32}$/.test(username)) {
      return res.status(400).json({ error: 'Gebruikersnaam: 3-32 tekens, alleen letters, cijfers, _ en .' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Wachtwoord moet minimaal 8 tekens zijn' });
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing) return res.status(409).json({ error: 'E-mail of gebruikersnaam is al in gebruik' });

    const id = await insert(
      'INSERT INTO users (email, username, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [email.toLowerCase(), username, hashPassword(password), fullName || null, 'user', 'active']
    );

    const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
    const accessToken = signAccessToken(user);
    const refreshToken = randomToken(48);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await insert(
      'INSERT INTO sessions (user_id, token_hash, user_agent, ip, expires_at) VALUES (?, ?, ?, ?, ?)',
      [id, sha256(refreshToken), req.headers['user-agent'] || null, req.ip, expiresAt]
    );

    setRefreshCookie(res, refreshToken, REFRESH_TOKEN_TTL_DAYS);
    return res.status(201).json({ token: accessToken, user: publicUser(user) });
  } catch (e) {
    return next(e);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email en password zijn verplicht' });

    const user = await queryOne('SELECT * FROM users WHERE email = ? OR username = ?', [email, email]);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Ongeldige inloggegevens' });
    }
    if (user.status === 'disabled') return res.status(403).json({ error: 'Account is uitgeschakeld' });

    const accessToken = signAccessToken(user);
    const refreshToken = randomToken(48);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    await insert(
      'INSERT INTO sessions (user_id, token_hash, user_agent, ip, expires_at) VALUES (?, ?, ?, ?, ?)',
      [user.id, sha256(refreshToken), req.headers['user-agent'] || null, req.ip, expiresAt]
    );

    setRefreshCookie(res, refreshToken, REFRESH_TOKEN_TTL_DAYS);
    return res.json({ token: accessToken, user: publicUser(user) });
  } catch (e) {
    return next(e);
  }
});

// POST /api/auth/refresh — refresh token uit cookie -> nieuwe access token
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.mb_refresh;
    if (!token) return res.status(401).json({ error: 'Geen refresh token' });

    const row = await queryOne(
      `SELECT s.*, u.role, u.status FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > NOW()`,
      [sha256(token)]
    );
    if (!row) return res.status(401).json({ error: 'Sessie verlopen, log opnieuw in' });
    if (row.status === 'disabled') return res.status(403).json({ error: 'Account is uitgeschakeld' });

    await query('UPDATE sessions SET last_used_at = NOW() WHERE id = ?', [row.id]);
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [row.user_id]);
    return res.json({ token: signAccessToken(user), user: publicUser(user) });
  } catch (e) {
    return next(e);
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.mb_refresh;
    if (token) await query('DELETE FROM sessions WHERE token_hash = ?', [sha256(token)]);
    clearRefreshCookie(res);
    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  return res.json({ user: publicUser(req.user) });
});

module.exports = router;