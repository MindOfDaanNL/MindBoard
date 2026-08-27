const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { queryOne } = require('../db');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m', issuer: 'mindboard' }
  );
}

async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Niet ingelogd' });

  try {
    const payload = jwt.verify(token, JWT_SECRET, { issuer: 'mindboard' });
    const user = await queryOne(
      'SELECT id, email, username, full_name, avatar_color, role, status FROM users WHERE id = ?',
      [payload.sub]
    );
    if (!user) return res.status(401).json({ error: 'Account bestaat niet meer' });
    if (user.status === 'disabled') return res.status(403).json({ error: 'Account is uitgeschakeld' });

    req.user = user;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Sessie verlopen of ongeldig' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Alleen voor beheerders' });
  return next();
}

module.exports = { signAccessToken, authenticate, requireAdmin };