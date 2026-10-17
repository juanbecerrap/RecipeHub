// backend/src/validators.js
// Funciones de validacion reutilizables.

import { HttpError } from './errors.js';

const MAX_ID = 2147483647;

// Convierte un identificador recibido como texto en un entero positivo.
export const parseId = (value, label = 'id') => {
  if (typeof value !== 'string' || !/^[0-9]{1,10}$/.test(value)) {
    throw new HttpError(400, `Identificador no valido: ${label}`);
  }
  const id = Number(value);
  if (id < 1 || id > MAX_ID) {
    throw new HttpError(400, `Identificador no valido: ${label}`);
  }
  return id;
};