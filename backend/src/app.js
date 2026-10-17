// backend/src/app.js
// Define la aplicacion Express: seguridad, CORS, limites y rutas.

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { config } from './config.js';
import { HttpError } from './errors.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { readOnlyDemo } from './middleware/readOnlyDemo.js';
import categoriesRouter from './routes/categories.js';
import recipesRouter from './routes/recipes.js';

const app = express();

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

// Limite de peticiones por IP
app.use(
  '/api',
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res, next) =>
      next(new HttpError(429, 'Demasiadas peticiones. Intentalo de nuevo mas tarde')),
  })
);

// Demo publica: bloquea escrituras antes de leer el cuerpo
app.use('/api', readOnlyDemo);

// Tamano maximo del cuerpo JSON
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    data: { status: 'ok', readOnly: config.readOnlyDemo },
  });
});

app.use('/api/categories', categoriesRouter);
app.use('/api/recipes', recipesRouter);

app.use(notFound);
app.use(errorHandler);

export default app;