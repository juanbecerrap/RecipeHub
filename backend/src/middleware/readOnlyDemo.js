// backend/src/middleware/readOnlyDemo.js
// En modo demo publica solo se permiten operaciones de lectura.

import { config } from '../config.js';
import { HttpError } from '../errors.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const readOnlyDemo = (req, res, next) => {
  if (config.readOnlyDemo && !SAFE_METHODS.has(req.method)) {
    return next(new HttpError(403, 'La demostracion publica es de solo lectura'));
  }
  next();
};