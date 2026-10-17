// backend/src/recipeValidator.js
// Valida y limpia los datos de una receta antes de guardarla.

import { HttpError } from './errors.js';

export const DIFFICULTIES = ['easy', 'medium', 'hard'];

const MAX_ID = 2147483647;

const LIMITS = Object.freeze({
  title: [3, 120],
  description: [10, 1000],
  preparationTime: [1, 1440],
  servings: [1, 50],
  steps: [1, 30],
  stepLength: [3, 500],
  ingredients: [1, 30],
  ingredientName: [2, 100],
  unit: [0, 20],
  maxQuantity: 99999.99,
  maxImageName: 100,
});

// Caracteres de control: todos, o todos salvo tabulador y saltos de linea
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const CONTROL_CHARS_EXCEPT_LINE_BREAKS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

// Solo un nombre de archivo de imagen, sin carpetas
const IMAGE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.(?:jpe?g|png|webp)$/i;

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readText = (value, field, [min, max], errors, { multiline = false } = {}) => {
  if (typeof value !== 'string') {
    errors.push({ field, message: 'Debe ser un texto' });
    return undefined;
  }
  const text = value.trim();
  if (text.length < min || text.length > max) {
    errors.push({
      field,
      message:
        min === 0
          ? `Debe tener como maximo ${max} caracteres`
          : `Debe tener entre ${min} y ${max} caracteres`,
    });
    return undefined;
  }
  const forbidden = multiline ? CONTROL_CHARS_EXCEPT_LINE_BREAKS : CONTROL_CHARS;
  if (forbidden.test(text)) {
    errors.push({ field, message: 'Contiene caracteres no permitidos' });
    return undefined;
  }
  return text;
};

const readInt = (value, field, [min, max], errors) => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    errors.push({ field, message: `Debe ser un entero entre ${min} y ${max}` });
    return undefined;
  }
  return value;
};

const readImagePath = (value, errors) => {
  if (value === undefined || value === null) return 'default.jpg';
  if (typeof value !== 'string') {
    errors.push({ field: 'imagePath', message: 'Debe ser un texto' });
    return undefined;
  }
  const name = value.trim();
  if (name === '') return 'default.jpg';
  if (name.length > LIMITS.maxImageName || !IMAGE_NAME.test(name)) {
    errors.push({
      field: 'imagePath',
      message: 'Debe ser un nombre de archivo .jpg, .jpeg, .png o .webp, sin carpetas',
    });
    return undefined;
  }
  return name;
};

const readDifficulty = (value, errors) => {
  if (typeof value !== 'string' || !DIFFICULTIES.includes(value)) {
    errors.push({ field: 'difficulty', message: 'Debe ser easy, medium o hard' });
    return undefined;
  }
  return value;
};

const readQuantity = (value, field, errors) => {
  const valid =
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= LIMITS.maxQuantity &&
    Math.round(value * 100) / 100 === value;
  if (!valid) {
    errors.push({
      field,
      message: `Debe ser un numero mayor que 0 y hasta ${LIMITS.maxQuantity}, con un maximo de 2 decimales`,
    });
    return undefined;
  }
  return value;
};

const readInstructions = (value, errors) => {
  const [min, max] = LIMITS.steps;
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    errors.push({
      field: 'instructions',
      message: `Debe ser una lista de ${min} a ${max} pasos`,
    });
    return undefined;
  }
  const steps = [];
  value.forEach((step, index) => {
    const text = readText(step, `instructions[${index}]`, LIMITS.stepLength, errors);
    if (text !== undefined) steps.push(text);
  });
  return steps;
};

// Aproxima la comparacion de MySQL (sin distinguir mayusculas ni tildes)
const normalizeName = (name) =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const readIngredients = (value, errors) => {
  const [min, max] = LIMITS.ingredients;
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    errors.push({
      field: 'ingredients',
      message: `Debe ser una lista de ${min} a ${max} ingredientes`,
    });
    return undefined;
  }

  const seen = new Set();
  const items = [];

  value.forEach((item, index) => {
    const prefix = `ingredients[${index}]`;
    if (!isPlainObject(item)) {
      errors.push({ field: prefix, message: 'Debe ser un objeto con name, quantity y unit' });
      return;
    }

    const name = readText(item.name, `${prefix}.name`, LIMITS.ingredientName, errors);
    const quantity = readQuantity(item.quantity, `${prefix}.quantity`, errors);
    const unit =
      item.unit === undefined || item.unit === null
        ? ''
        : readText(item.unit, `${prefix}.unit`, LIMITS.unit, errors);

    if (name !== undefined) {
      const key = normalizeName(name);
      if (seen.has(key)) {
        errors.push({ field: `${prefix}.name`, message: 'Ingrediente repetido en la receta' });
      }
      seen.add(key);
    }

    if (name !== undefined && quantity !== undefined && unit !== undefined) {
      items.push({ name, quantity, unit });
    }
  });

  return items;
};

// Devuelve los datos limpios o lanza HttpError (400 si no es un objeto, 422 si hay campos invalidos)
export const validateRecipeInput = (body) => {
  if (!isPlainObject(body)) {
    throw new HttpError(400, 'El cuerpo de la peticion debe ser un objeto JSON');
  }

  const errors = [];

  const title = readText(body.title, 'title', LIMITS.title, errors);
  const description = readText(body.description, 'description', LIMITS.description, errors, {
    multiline: true,
  });
  const imagePath = readImagePath(body.imagePath, errors);
  const preparationTime = readInt(
    body.preparationTime,
    'preparationTime',
    LIMITS.preparationTime,
    errors
  );
  const difficulty = readDifficulty(body.difficulty, errors);
  const servings = readInt(body.servings, 'servings', LIMITS.servings, errors);
  const categoryId = readInt(body.categoryId, 'categoryId', [1, MAX_ID], errors);
  const instructions = readInstructions(body.instructions, errors);
  const ingredients = readIngredients(body.ingredients, errors);

  if (errors.length > 0) {
    throw new HttpError(422, 'Los datos de la receta no son validos', errors);
  }

  return {
    title,
    description,
    imagePath,
    preparationTime,
    difficulty,
    servings,
    categoryId,
    instructions,
    ingredients,
  };
};