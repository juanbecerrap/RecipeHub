// backend/src/db.js
// Pool de conexiones a MySQL. Las consultas deben usar pool.execute con parametros (?).

import mysql from 'mysql2/promise';
import { config } from './config.js';

// Con TLS se verifica siempre el certificado del servidor. Si hay un
// certificado CA propio (por ejemplo, el de Aiven), se usa para verificarlo.
const ssl = config.db.ssl
  ? { rejectUnauthorized: true, ...(config.db.sslCa ? { ca: config.db.sslCa } : {}) }
  : undefined;

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  ssl,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  decimalNumbers: true,
});

// Comprueba que la base de datos responde (se usara en la ruta de salud).
export const checkDatabase = async () => {
  const [rows] = await pool.query('SELECT 1 AS ok');
  return rows[0].ok === 1;
};