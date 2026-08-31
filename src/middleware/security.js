// Security-, logging- en rate-limit middleware (zero-dependency, pkg-veilig)

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'data', 'logs');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Security headers (helmet-lite, zonder dependency)
// ---------------------------------------------------------------------------
function securityHeaders(req, res, next) {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; connect-src 'self' http: https: ws: wss:; font-src 'self' data: https://fonts.gstatic.com"
  );
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return next();
}

// ---------------------------------------------------------------------------
// Verzoek-logging (naar console + data/logs/access.log)
// ---------------------------------------------------------------------------
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const line = `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms ip=${req.ip}`;
    console.log(line);
    try {
      ensureLogDir();
      fs.appendFileSync(path.join(LOG_DIR, 'access.log'), line + '\n');
    } catch (e) { /* loggen mag nooit crashen */ }
  });
  return next();
}

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, per IP)
// ---------------------------------------------------------------------------
const buckets = new Map();
const WINDOW_MS = 60 * 1000;

function rateLimit({ windowMs = WINDOW_MS, max, name = 'api' } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${name}:${req.ip}`;
    let b = buckets.get(key);
    if (!b || now > b.resetAt) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(key, b);
    }
    b.count++;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - b.count));
    if (b.count > max) {
      res.setHeader('Retry-After', Math.ceil((b.resetAt - now) / 1000));
      return res.status(429).json({ error: 'Te veel verzoeken. Even wachten en opnieuw proberen.' });
    }
    return next();
  };
}

// Ruim oude buckets op (elke minuut)
setInterval(() => {
  const now = Date.now();
  for (const [key, b] of buckets) {
    if (now > b.resetAt) buckets.delete(key);
  }
  if (buckets.size > 5000) buckets.clear();
}, 60 * 1000).unref();

// ---------------------------------------------------------------------------
// Error-log naar bestand
// ---------------------------------------------------------------------------
function logError(err, req) {
  try {
    ensureLogDir();
    const line = `${new Date().toISOString()} ${req ? req.method + ' ' + req.originalUrl : '-'} ${err.stack || err.message}`;
    fs.appendFileSync(path.join(LOG_DIR, 'error.log'), line + '\n');
  } catch (e) { /* negeer */ }
}

module.exports = { securityHeaders, requestLogger, rateLimit, logError, LOG_DIR };