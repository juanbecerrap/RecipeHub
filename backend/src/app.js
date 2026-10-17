// backend/src/app.js
// Define la aplicacion Express: seguridad, CORS, limites y rutas.

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { config } from './config.js';
import { checkDatabase } from './db.js';
import { HttpError } from './errors.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { readOnlyDemo } from './middleware/readOnlyDemo.js';
import categoriesRouter from './routes/categories.js';
import recipesRouter from './routes/recipes.js';

const app = express();

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const tooManyRequests = (req, res, next) =>
  next(new HttpError(429, 'Demasiadas peticiones. Intentalo de nuevo mas tarde'));

// Cabeceras de seguridad basicas
app.use(helmet());

// CORS con lista blanca. Sin cabecera Origin (curl, herramientas) se permite.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    maxAge: 600,
  })
);

// Limite general de peticiones por IP
app.use(
  '/api',
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: tooManyRequests,
  })
);

// Demo publica: bloquea escrituras antes de leer el cuerpo
app.use('/api', readOnlyDemo);

// Limite mas estricto para escrituras (POST, PUT y DELETE)
app.use(
  '/api',
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.writeMax,
    skip: (req) => SAFE_METHODS.has(req.method),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: tooManyRequests,
  })
);

// Tamano maximo del cuerpo JSON
app.use(express.json({ limit: '50kb' }));

// Estado del servicio y de la base de datos
app.get('/api/health', async (req, res) => {
  try {
    await checkDatabase();
  } catch (error) {
    // Solo el codigo del error, nunca datos de la conexion
    console.error('Comprobacion de salud: base de datos no disponible', error.code ?? '');
    throw new HttpError(503, 'Base de datos no disponible');
  }

  res.json({
    ok: true,
    data: { status: 'ok', database: 'ok', readOnly: config.readOnlyDemo },
  });
});

app.use('/api/categories', categoriesRouter);
app.use('/api/recipes', recipesRouter);

app.use(notFound);
app.use(errorHandler);

export default app;