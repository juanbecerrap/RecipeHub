// backend/src/config.js
// Lee y valida las variables de entorno al arrancar.
// Los mensajes de error nombran la variable, nunca su valor.

const required = (name) => {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  }
  return value.trim();
};

const toInt = (name, fallback) => {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const number = Number(raw);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`La variable ${name} debe ser un entero positivo`);
  }
  return number;
};

const toBool = (name, fallback = false) => {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = raw.trim().toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`La variable ${name} debe ser true o false`);
};

// Entero igual o mayor que 0 (0 significa desactivado).
const toCount = (name, fallback = 0) => {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const number = Number(raw);
  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`La variable ${name} debe ser un entero igual o mayor que 0`);
  }
  return number;
};

// Certificado CA en formato PEM (opcional). Se acepta pegado con saltos de
// linea reales o escritos como \n, segun como lo guarde cada plataforma.
const parseCertificate = (name) => {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return undefined;
  const pem = raw.trim().replace(/\\n/g, '\n');
  if (!pem.includes('-----BEGIN CERTIFICATE-----') || !pem.includes('-----END CERTIFICATE-----')) {
    throw new Error(`La variable ${name} debe contener un certificado en formato PEM`);
  }
  return pem;
};

const parseOrigins = (name) => {
  const origins = required(name)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error(`La variable ${name} no contiene ningun origen`);
  }

  for (const origin of origins) {
    let normalized = null;
    try {
      normalized = new URL(origin).origin;
    } catch {
      normalized = null;
    }
    if (normalized !== origin) {
      throw new Error(
        `La variable ${name} contiene un origen invalido: use el formato https://dominio sin barra final ni comodines`
      );
    }
  }
  return origins;
};

const dbSsl = toBool('DB_SSL', false);
const dbSslCa = parseCertificate('DB_SSL_CA');
if (dbSslCa && !dbSsl) {
  throw new Error('La variable DB_SSL_CA requiere DB_SSL=true');
}

export const config = Object.freeze({
  env: process.env.NODE_ENV?.trim() || 'development',
  port: toInt('PORT', 3000),
  // Numero de proxies de confianza delante de la API (0 = ninguno, en local).
  trustProxy: toCount('TRUST_PROXY', 0),
  db: Object.freeze({
    host: required('DB_HOST'),
    port: toInt('DB_PORT', 3306),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
    ssl: dbSsl,
    sslCa: dbSslCa,
    connectionLimit: toInt('DB_CONNECTION_LIMIT', 10),
  }),
  corsOrigins: parseOrigins('CORS_ORIGINS'),
  readOnlyDemo: toBool('READ_ONLY_DEMO', false),
  rateLimit: Object.freeze({
    windowMs: toInt('RATE_LIMIT_WINDOW_MS', 900000),
    max: toInt('RATE_LIMIT_MAX', 100),
    writeMax: toInt('WRITE_RATE_LIMIT_MAX', 20),
  }),
});