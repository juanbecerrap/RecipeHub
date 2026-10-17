// backend/src/errors.js
// Error con codigo HTTP para respuestas controladas de la API.

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}