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