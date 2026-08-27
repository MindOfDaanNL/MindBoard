const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { PUBLIC_DIR, PORT } = require('./config');
const { ping } = require('./db');
const { securityHeaders, requestLogger, rateLimit, logError } = require('./middleware/security');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const orgsRoutes = require('./routes/orgs');
const invitationsRoutes = require('./routes/invitations');
const projectsRoutes = require('./routes/projects');
const boardsRoutes = require('./routes/boards');
const tasksRoutes = require('./routes/tasks');
const notificationsRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');
const adminRoutes = require('./routes/admin');

const app = express();

app.set('trust proxy', true);
app.disable('x-powered-by');

app.use(securityHeaders);
app.use(requestLogger);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Rate limiting op auth-endpoints (brute-force bescherming)
app.use('/api/auth', rateLimit({ windowMs: 60 * 1000, max: 20, name: 'auth' }));

// Health check (zonder auth)
app.get('/api/health', async (req, res) => {
  try {
    await ping();
    res.json({ status: 'ok', service: 'MindBoard', db: 'ok', time: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'error', db: e.message, time: new Date().toISOString() });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/orgs', orgsRoutes);
app.use('/api/invitations', invitationsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/boards', boardsRoutes);
app.use('/api/projects/:projectId/boards', boardsRoutes);
app.use('/api/boards/:boardId/tasks', tasksRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/activity', searchRoutes.activityRouter);
app.use('/api/admin', adminRoutes);

// Onbekende API-routes → JSON 404 (niet de SPA-fallback)
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Onbekend endpoint: ${req.method} ${req.originalUrl}` });
});

// Static frontend (SPA fallback)
app.get(['/', '/index.html', '/sw.js'], (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});
app.use(express.static(PUBLIC_DIR, { index: 'index.html', maxAge: '1h' }));
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  logError(err, req);
  console.error('[fout]', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Serverfout: ' + err.message });
});

module.exports = app;