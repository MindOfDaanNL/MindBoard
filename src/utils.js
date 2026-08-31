const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query } = require('./db');

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function uniqueSlug(base, table, col = 'slug') {
  let slug = slugify(base) || 'org';
  let n = 0;
  let candidate = slug;
  while (true) {
    const row = await query(`SELECT id FROM ${table} WHERE ${col} = ?`, [candidate]);
    if (!row.length) return candidate;
    n++;
    candidate = `${slug}-${n}`;
  }
}

function hashPassword(pw) {
  return bcrypt.hashSync(pw, 10);
}

function verifyPassword(pw, hash) {
  return bcrypt.compareSync(pw, hash);
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    fullName: row.full_name,
    avatarColor: row.avatar_color,
    avatarUrl: row.avatar_url,
    role: row.role,
    status: row.status,
    createdAt: row.created_at
  };
}

function initials(nameOrUser) {
  const full = typeof nameOrUser === 'string' ? nameOrUser : nameOrUser.full_name || nameOrUser.username;
  return String(full)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function nowIso() {
  return new Date().toISOString();
}

function cleanTagName(name) {
  return String(name).trim().slice(0, 60);
}

module.exports = {
  slugify,
  uniqueSlug,
  hashPassword,
  verifyPassword,
  randomToken,
  sha256,
  publicUser,
  initials,
  nowIso,
  cleanTagName
};