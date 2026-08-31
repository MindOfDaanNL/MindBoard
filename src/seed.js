const { query, queryOne, insert, transaction } = require('./db');
const { hashPassword } = require('./utils');

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@mindboard.dev';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin12345';

async function ensureUser(email, username, fullName, password, role) {
  const existing = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (existing) return existing;
  const id = await insert(
    'INSERT INTO users (email, username, password_hash, full_name, role, status) VALUES (?, ?, ?, ?, ?, ?)',
    [email, username, hashPassword(password), fullName, role, 'active']
  );
  const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
  console.log(`  + Gebruiker aangemaakt: ${username} (${email})`);
  return user;
}

async function main() {
  console.log('MindBoard seed\n');

  const admin = await ensureUser(ADMIN_EMAIL, 'admin', 'Platform Beheerder', ADMIN_PASSWORD, 'admin');
  const demo = await ensureUser('demo@mindboard.dev', 'demo', 'Demo Gebruiker', 'demo12345', 'user');

  // Organisatie "MindBoard HQ"
  let org = await queryOne('SELECT * FROM orgs WHERE slug = ?', ['mindboard-hq']);
  if (!org) {
    const orgId = await transaction(async (conn) => {
      const r = await conn.query(
        'INSERT INTO orgs (name, slug, description, owner_id) VALUES (?, ?, ?, ?)',
        ['MindBoard HQ', 'mindboard-hq', 'De organisatie achter MindBoard', admin.id]
      );
      const id = Number(r.insertId);
      await conn.query('INSERT INTO org_members (org_id, user_id, role) VALUES (?, ?, ?)', [id, admin.id, 'owner']);
      await conn.query('INSERT INTO org_members (org_id, user_id, role) VALUES (?, ?, ?)', [id, demo.id, 'admin']);
      return id;
    });
    org = await queryOne('SELECT * FROM orgs WHERE id = ?', [orgId]);
    console.log('  + Organisatie "MindBoard HQ" aangemaakt');
  } else {
    await query('INSERT IGNORE INTO org_members (org_id, user_id, role) VALUES (?, ?, ?)', [org.id, admin.id, 'owner']);
    await query('INSERT IGNORE INTO org_members (org_id, user_id, role) VALUES (?, ?, ?)', [org.id, demo.id, 'admin']);
  }

  // Project "Roadmap 2026"
  let project = await queryOne("SELECT * FROM projects WHERE org_id = ? AND name = 'Roadmap 2026'", [org.id]);
  if (!project) {
    const projectId = await transaction(async (conn) => {
      const r = await conn.query(
        'INSERT INTO projects (org_id, name, description, color, icon, created_by) VALUES (?, ?, ?, ?, ?, ?)',
        [org.id, 'Roadmap 2026', 'De productroadmap voor 2026', '#4f46e5', '🚀', admin.id]
      );
      const pid = Number(r.insertId);
      await conn.query('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [pid, demo.id, 'member']);

      const b = await conn.query('INSERT INTO boards (project_id, name, position) VALUES (?, ?, 0)', [pid, 'Roadmap']);
      const boardId = Number(b.insertId);
      const cols = [
        ['📋 Backlog', '#94a3b8'],
        ['🔨 In ontwikkeling', '#fbbf24'],
        ['🔎 Review', '#38bdf8'],
        ['✅ Afgerond', '#4ade80']
      ];
      const columnIds = [];
      for (let i = 0; i < cols.length; i++) {
        const c = await conn.query('INSERT INTO columns (board_id, name, color, position) VALUES (?, ?, ?, ?)', [
          boardId,
          cols[i][0],
          cols[i][1],
          i
        ]);
        columnIds.push(Number(c.insertId));
      }

      const sample = [
        { title: 'Accounts en rollen bouwen', desc: 'Authenticatie met JWT, sessies en rolgebaseerde toegang.', prio: 'urgent', assignee: admin.id },
        { title: 'Organisaties en projecten', desc: 'Multi-tenant organisaties met projecten en permissies.', prio: 'high', assignee: demo.id },
        { title: 'Kanban-borden uitbreiden', desc: 'Drag & drop, kolommen, WIP-limieten en labels.', prio: 'high', assignee: demo.id },
        { title: 'Windows-exe en Android-app', desc: 'Packaging via pkg (SEA) en Capacitor/PWA.', prio: 'medium', assignee: null }
      ];
      for (let i = 0; i < sample.length; i++) {
        const s = sample[i];
        const colIdx = i < 2 ? 0 : i < 3 ? 1 : 2;
        await conn.query(
          'INSERT INTO tasks (board_id, column_id, title, description, priority, position, assignee_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [boardId, columnIds[colIdx], s.title, s.desc, s.prio, i, s.assignee, admin.id]
        );
      }
      return pid;
    });
    project = await queryOne('SELECT * FROM projects WHERE id = ?', [projectId]);
    console.log('  + Project "Roadmap 2026" met bord en taken aangemaakt');
  }

  console.log('\nKlaar!\n');
  console.log(`  Admin  : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  Demo   : demo@mindboard.dev / demo12345\n`);
}

main()
  .catch((e) => {
    console.error('Seed mislukt:', e);
    process.exit(1);
  })
  .finally(() => {
    const { pool } = require('./db');
    pool.end();
    setTimeout(() => process.exit(0), 100);
  });