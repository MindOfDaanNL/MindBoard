// MindBoard backend-tests (node --test)
// Vereist een draaiende MariaDB met de mindboard-database.
// Maakt tijdelijke testdata aan en ruimt die weer op.

const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const app = require('../src/app');
const { query } = require('../src/db');
const { randomToken } = require('../src/utils');

const EMAIL = `test-${Date.now()}@mindboard.test`;
const PASSWORD = 'test12345';

let token = null;
let userId = null;
let orgId = null;
let projectId = null;
let boardId = null;
let taskId = null;

test.before(async () => {
  // Registreer een testgebruiker
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: EMAIL, username: `test${Date.now() % 100000}`, password: PASSWORD, fullName: 'Test Gebruiker' });
  assert.strictEqual(res.status, 201, res.body.error || '');
  token = res.body.token;
  userId = res.body.user.id;
});

test.after(async () => {
  // Ruim testdata op
  if (orgId) await query('DELETE FROM orgs WHERE id = ?', [orgId]);
  if (userId) await query('DELETE FROM users WHERE id = ?', [userId]);
  const { pool } = require('../src/db');
  await pool.end();
});

test('health check werkt', async () => {
  const res = await request(app).get('/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ok');
});

test('auth: fout wachtwoord geeft 401', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: EMAIL, password: 'fout-wachtwoord' });
  assert.strictEqual(res.status, 401);
});

test('auth: me geeft de ingelogde gebruiker', async () => {
  const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.user.email, EMAIL);
});

test('organisatie aanmaken', async () => {
  const res = await request(app)
    .post('/api/orgs')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: `Test Org ${Date.now()}`, description: 'tijdelijk' });
  assert.strictEqual(res.status, 201, res.body.error || '');
  orgId = res.body.org.id;
});

test('project aanmaken binnen organisatie', async () => {
  const res = await request(app)
    .post(`/api/projects?orgId=${orgId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test Project' });
  assert.strictEqual(res.status, 201, res.body.error || '');
  projectId = res.body.project.id;
  assert.strictEqual(res.body.project.org_id, orgId);
});

test('project heeft standaard een bord met kolommen', async () => {
  const res = await request(app)
    .get(`/api/projects/${projectId}`)
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.boards.length >= 1);
  boardId = res.body.boards[0].id;
});

test('bord heeft kolommen', async () => {
  const res = await request(app)
    .get(`/api/boards/${boardId}`)
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.columns.length >= 1);
});

test('taak aanmaken op het bord', async () => {
  const res = await request(app)
    .post(`/api/boards/${boardId}/tasks`)
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Test taak', priority: 'high' });
  assert.strictEqual(res.status, 201, res.body.error || '');
  taskId = res.body.task.id;
});

test('taak verplaatsen naar kolom', async () => {
  const col2 = (await request(app).get(`/api/boards/${boardId}`).set('Authorization', `Bearer ${token}`)).body.columns[1];
  const res = await request(app)
    .post(`/api/tasks/${taskId}/move`)
    .set('Authorization', `Bearer ${token}`)
    .send({ columnId: col2.id });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.task.column_id, col2.id);
});

test('comment toevoegen aan taak', async () => {
  const res = await request(app)
    .post(`/api/tasks/${taskId}/comments`)
    .set('Authorization', `Bearer ${token}`)
    .send({ body: 'Test reactie' });
  assert.strictEqual(res.status, 201, res.body.error || '');
});

test('checklist + items aanmaken en afvinken', async () => {
  const cl = await request(app)
    .post(`/api/tasks/${taskId}/checklists`)
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Stappenplan' });
  assert.strictEqual(cl.status, 201, cl.body.error || '');
  const clId = cl.body.checklist.id;

  const item = await request(app)
    .post(`/api/tasks/${taskId}/checklists/${clId}/items`)
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Stap 1' });
  assert.strictEqual(item.status, 201, item.body.error || '');
  const itemId = item.body.item.id;

  const done = await request(app)
    .patch(`/api/tasks/${taskId}/items/${itemId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ isDone: true });
  assert.strictEqual(done.status, 200);
  assert.strictEqual(done.body.item.is_done, 1);
});

test('zoeken vindt de taak', async () => {
  const res = await request(app)
    .get('/api/search?q=Test%20taak')
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.tasks.some((t) => t.id === taskId));
});

test('activiteitenlog bevat entries', async () => {
  const res = await request(app)
    .get(`/api/activity?orgId=${orgId}`)
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.activity.length >= 1);
});

test('CSV-export werkt', async () => {
  const res = await request(app)
    .get(`/api/projects/${projectId}/export`)
    .set('Authorization', `Bearer ${token}`);
  assert.strictEqual(res.status, 200);
  assert.ok(res.headers['content-type'].includes('text/csv'));
  assert.ok(res.text.includes('title'));
});

test('RBAC: onbekende API-route geeft JSON 404', async () => {
  const res = await request(app).get('/api/bestaatniet').set('Authorization', `Bearer ${token}`);
  assert.strictEqual(res.status, 404);
  assert.ok(res.body.error);
});

test('RBAC: niet-ingelogd geeft 401', async () => {
  const res = await request(app).get('/api/orgs');
  assert.strictEqual(res.status, 401);
});

// ============================================================================
// WIP-limieten
// ============================================================================

test('WIP: verplaatsen naar volle kolom geeft 409', async () => {
  const board = (await request(app).get(`/api/boards/${boardId}`).set('Authorization', `Bearer ${token}`)).body;
  const col2 = board.columns[1];
  await request(app).patch(`/api/columns/${col2.id}`).set('Authorization', `Bearer ${token}`).send({ wipLimit: 1 });

  const t1 = await request(app).post(`/api/boards/${boardId}/tasks`).set('Authorization', `Bearer ${token}`).send({ title: 'WIP test 1' });
  assert.strictEqual(t1.status, 201);
  const t2 = await request(app).post(`/api/boards/${boardId}/tasks`).set('Authorization', `Bearer ${token}`).send({ title: 'WIP test 2' });
  assert.strictEqual(t2.status, 201);

  const move1 = await request(app).post(`/api/tasks/${t1.body.task.id}/move`).set('Authorization', `Bearer ${token}`).send({ columnId: col2.id });
  assert.strictEqual(move1.status, 200);
  const move2 = await request(app).post(`/api/tasks/${t2.body.task.id}/move`).set('Authorization', `Bearer ${token}`).send({ columnId: col2.id });
  assert.strictEqual(move2.status, 409);
  assert.match(move2.body.error, /WIP-limiet/);

  await request(app).patch(`/api/columns/${col2.id}`).set('Authorization', `Bearer ${token}`).send({ wipLimit: null });
});

test('WIP: taak aanmaken in volle kolom geeft 409', async () => {
  const board = (await request(app).get(`/api/boards/${boardId}`).set('Authorization', `Bearer ${token}`)).body;
  const col = board.columns[0];
  const created = await request(app).post(`/api/boards/${boardId}/tasks`).set('Authorization', `Bearer ${token}`).send({ title: 'WIP vol' });
  assert.strictEqual(created.status, 201);
  await request(app).patch(`/api/columns/${col.id}`).set('Authorization', `Bearer ${token}`).send({ wipLimit: 0 });
  const blocked = await request(app).post(`/api/boards/${boardId}/tasks`).set('Authorization', `Bearer ${token}`).send({ title: 'WIP geblokkeerd' });
  assert.strictEqual(blocked.status, 409);
  await request(app).patch(`/api/columns/${col.id}`).set('Authorization', `Bearer ${token}`).send({ wipLimit: null });
});

// ============================================================================
// Projecttoegang: alleen expliciete projectleden + org owner/admin
// ============================================================================

let token2 = null;
let user2Id = null;

test('projecttoegang: org-lid zonder projectlidmaatschap krijgt 403', async () => {
  const EMAIL2 = `test2-${Date.now()}@mindboard.test`;
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ email: EMAIL2, username: `test2${Date.now() % 100000}`, password: PASSWORD, fullName: 'Tweede Gebruiker' });
  assert.strictEqual(reg.status, 201, reg.body.error || '');
  token2 = reg.body.token;
  user2Id = reg.body.user.id;

  await request(app).post(`/api/orgs/${orgId}/members`).set('Authorization', `Bearer ${token}`).send({ userId: user2Id, role: 'viewer' });

  const denied = await request(app).get(`/api/projects/${projectId}`).set('Authorization', `Bearer ${token2}`);
  assert.strictEqual(denied.status, 403);
});

test('projecttoegang: na toevoegen als projectlid is toegang toegestaan', async () => {
  await request(app).post(`/api/projects/${projectId}/members`).set('Authorization', `Bearer ${token}`).send({ userId: user2Id, role: 'member' });
  const allowed = await request(app).get(`/api/projects/${projectId}`).set('Authorization', `Bearer ${token2}`);
  assert.strictEqual(allowed.status, 200);
  assert.strictEqual(allowed.body.myRole, 'member');
});

// ============================================================================
// Notificatievoorkeuren
// ============================================================================

test('notificatieprefs: uitschakelen assignment stopt de notificatie', async () => {
  await request(app).patch('/api/notifications/prefs').set('Authorization', `Bearer ${token2}`).send({ assignment: false });

  const t = await request(app).post(`/api/boards/${boardId}/tasks`).set('Authorization', `Bearer ${token}`).send({ title: 'Prefs taak', assigneeId: user2Id });
  assert.strictEqual(t.status, 201);

  const notif = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token2}`);
  assert.strictEqual(notif.status, 200);
  assert.ok(!notif.body.notifications.some((n) => n.type === 'assignment'));

  await request(app).patch('/api/notifications/prefs').set('Authorization', `Bearer ${token2}`).send({ assignment: true });
  const t2 = await request(app).post(`/api/boards/${boardId}/tasks`).set('Authorization', `Bearer ${token}`).send({ title: 'Prefs taak 2', assigneeId: user2Id });
  assert.strictEqual(t2.status, 201);

  const notif2 = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token2}`);
  assert.ok(notif2.body.notifications.some((n) => n.type === 'assignment' && n.title.includes('toegewezen')));
});

// ============================================================================
// @mentions
// ============================================================================

test('@mention in comment geeft notificatie voor de vermelde gebruiker', async () => {
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  const mention = await request(app).post(`/api/tasks/${taskId}/comments`).set('Authorization', `Bearer ${token2}`).send({ body: `Hoi @${me.body.user.username}, kijk hier eens` });
  assert.strictEqual(mention.status, 201, mention.body.error || '');

  const notif = await request(app).get('/api/notifications?limit=50').set('Authorization', `Bearer ${token}`);
  assert.ok(notif.body.notifications.some((n) => n.type === 'mention'));
});

// ============================================================================
// Advanced search
// ============================================================================

test('search: advanced syntax assignee:me en label:', async () => {
  const tagged = await request(app).post(`/api/boards/${boardId}/tasks`).set('Authorization', `Bearer ${token}`).send({ title: 'Gelabelde taak', tags: ['bug'] });
  assert.strictEqual(tagged.status, 201);
  const taggedId = tagged.body.task.id;

  const byLabel = await request(app).get('/api/search?q=label:bug').set('Authorization', `Bearer ${token}`);
  assert.ok(byLabel.body.tasks.some((t) => t.id === taggedId));

  const byMe = await request(app).get('/api/search?q=assignee:me').set('Authorization', `Bearer ${token}`);
  assert.strictEqual(byMe.status, 200);
  assert.ok(Array.isArray(byMe.body.tasks));
});

// ============================================================================
// Recurring tasks
// ============================================================================

test('recurring: scheduler maakt de volgende occurrence aan', async () => {
  const { checkRecurring } = require('../src/recurring');
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const rec = await request(app).post(`/api/boards/${boardId}/tasks`).set('Authorization', `Bearer ${token}`).send({
    title: 'Wekelijkse check',
    dueDate: yesterday,
    recurrenceRule: 'daily',
    recurrenceInterval: 1
  });
  assert.strictEqual(rec.status, 201, rec.body.error || '');
  assert.strictEqual(rec.body.task.recurrence_rule, 'daily');

  const spawned = await checkRecurring();
  assert.ok(spawned >= 1);

  const board = (await request(app).get(`/api/boards/${boardId}`).set('Authorization', `Bearer ${token}`)).body;
  const today = new Date().toISOString().slice(0, 10);
  assert.ok(board.tasks.some((t) => t.title === 'Wekelijkse check' && t.due_date === today && t.id !== rec.body.task.id));
});