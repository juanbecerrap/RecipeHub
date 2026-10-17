// backend/src/middleware/errorHandler.js
// Respuestas de error en formato JSON consistente.

import { HttpError } from '../errors.js';

export const notFound = (req, res, next) => {
  next(new HttpError(404, 'Ruta no encontrada'));
};

// Express reconoce un manejador de errores por sus cuatro parametros.
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let status = 500;
  let message = 'Error interno del servidor';
  let details;

  if (err instanceof HttpError) {
    status = err.status;
    message = err.message;
    details = err.details;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'El cuerpo de la peticion no es JSON valido';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'El cuerpo de la peticion es demasiado grande';
  }

  if (status === 500) {
    console.error(err);
  }

  const body = { ok: false, error: { message } };
  if (details) {
    body.error.details = details;
  }
  res.status(status).json(body);
};