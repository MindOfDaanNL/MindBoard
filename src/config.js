const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const PORT = Number(process.env.PORT) || 3002;
const HOST = process.env.HOST || '0.0.0.0';

const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'mindboard',
  password: process.env.DB_PASSWORD || 'MindDev-MindBoard1998',
  database: process.env.DB_NAME || 'mindboard',
  connectionLimit: Number(process.env.DB_POOL) || 10,
  charset: 'utf8mb4'
};

const JWT_SECRET = process.env.JWT_SECRET || 'mindboard-dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 30;

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DATA_DIR = path.join(__dirname, '..', 'data');

module.exports = { PORT, HOST, DB, JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_TTL_DAYS, PUBLIC_DIR, DATA_DIR };