// Relatief pad ipv 'mariadb' package-name: de package gebruikt alleen een
// conditional 'exports' veld (geen 'main'), wat de pkg-bundler breekt.
const mariadb = require('../node_modules/mariadb/dist/promise.cjs');
const { DB } = require('./config');

const pool = mariadb.createPool({
  host: DB.host,
  port: DB.port,
  user: DB.user,
  password: DB.password,
  database: DB.database,
  connectionLimit: DB.connectionLimit,
  charset: DB.charset,
  bigNumberStrings: false,
  supportBigNumbers: true,
  insertIdAsNumber: true
});

async function query(sql, params) {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(sql, params);
    return rows;
  } finally {
    conn.release();
  }
}

async function queryOne(sql, params) {
  const rows = await query(sql, params);
  return Array.isArray(rows) ? rows[0] : null;
}

async function insert(sql, params) {
  const conn = await pool.getConnection();
  try {
    const res = await conn.query(sql, params);
    return Number(res.insertId);
  } finally {
    conn.release();
  }
}

async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function ping() {
  await query('SELECT 1');
}

module.exports = { pool, query, queryOne, insert, transaction, ping };