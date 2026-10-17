// backend/test/recipeValidator.test.js
// Pruebas del validador. Se ejecutan con: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validateRecipeInput } from '../src/recipeValidator.js';
import { HttpError } from '../src/errors.js';

const validBody = (overrides = {}) => ({
  title: 'Pancakes esponjosos',
  description: 'Tortitas altas y suaves para el desayuno.',
  imagePath: 'pancakes.jpg',
  preparationTime: 20,
  difficulty: 'easy',
  servings: 4,
  categoryId: 1,
  instructions: ['Mezcla los ingredientes secos.', 'Bate los huevos con la leche.'],
  ingredients: [
    { name: 'Harina de trigo', quantity: 200, unit: 'g' },
    { name: 'Huevos', quantity: 2, unit: '' },
  ],
  ...overrides,
});

// Ejecuta la validacion y devuelve el error lanzado (falla la prueba si no hay error)
const failure = (body) => {
  try {
    validateRecipeInput(body);
  } catch (error) {
    return error;
  }
  return assert.fail('La validacion deberia haber fallado');
};

const fieldsOf = (error) => error.details.map((detail) => detail.field);

test('acepta una receta valida y limpia los espacios', () => {
  const result = validateRecipeInput(
    validBody({
      title: '  Pancakes esponjosos  ',
      ingredients: [{ name: ' Leche ', quantity: 250.5, unit: ' ml ' }],
    })
  );
  assert.equal(result.title, 'Pancakes esponjosos');
  assert.deepEqual(result.ingredients, [{ name: 'Leche', quantity: 250.5, unit: 'ml' }]);
  assert.equal(validateRecipeInput(validBody({ imagePath: 'mi-foto.WEBP' })).imagePath, 'mi-foto.WEBP');
});

test('usa default.jpg si no se envia imagePath', () => {
  for (const imagePath of [undefined, null, '', '   ']) {
    assert.equal(validateRecipeInput(validBody({ imagePath })).imagePath, 'default.jpg');
  }
});

test('rechaza titulo corto y dificultad invalida a la vez', () => {
  const error = failure(validBody({ title: 'ab', difficulty: 'extreme' }));
  assert.ok(error instanceof HttpError);
  assert.equal(error.status, 422);
  assert.deepEqual(fieldsOf(error), ['title', 'difficulty']);
});

test('rechaza rutas y extensiones no permitidas en imagePath', () => {
  for (const imagePath of ['../secreto.jpg', 'img/a.jpg', 'a.gif', 'a.jpg.exe', 'C:\\a.jpg']) {
    assert.deepEqual(fieldsOf(failure(validBody({ imagePath }))), ['imagePath'], imagePath);
  }
});

test('rechaza numeros enviados como texto o decimales', () => {
  const error = failure(validBody({ preparationTime: '20', servings: 4.5, categoryId: 0 }));
  assert.deepEqual(fieldsOf(error), ['preparationTime', 'servings', 'categoryId']);
});

test('aplica los limites de tiempo y porciones', () => {
  const error = failure(validBody({ preparationTime: 1441, servings: 0 }));
  assert.deepEqual(fieldsOf(error), ['preparationTime', 'servings']);
  assert.doesNotThrow(() => validateRecipeInput(validBody({ preparationTime: 1440, servings: 50 })));
});

test('valida la lista de instrucciones', () => {
  assert.deepEqual(fieldsOf(failure(validBody({ instructions: [] }))), ['instructions']);
  assert.deepEqual(
    fieldsOf(failure(validBody({ instructions: ['Paso uno\nPaso dos'] }))),
    ['instructions[0]']
  );
  const tooMany = Array.from({ length: 31 }, (_, i) => `Paso numero ${i + 1}`);
  assert.deepEqual(fieldsOf(failure(validBody({ instructions: tooMany }))), ['instructions']);
});

test('valida cada ingrediente', () => {
  assert.deepEqual(fieldsOf(failure(validBody({ ingredients: [] }))), ['ingredients']);

  const error = failure(
    validBody({
      ingredients: [
        { name: 'Sal', quantity: 0, unit: 'g' },
        { name: 'Aceite', quantity: 1.234, unit: 'ml' },
        { name: 'Harina', quantity: 100000, unit: 'g' },
        { name: 'Leche', quantity: '5', unit: 'ml' },
        { name: 'X', quantity: 1, unit: 'g' },
        { name: 'Agua', quantity: 1, unit: 'una unidad muy larga de verdad' },
      ],
    })
  );
  assert.deepEqual(fieldsOf(error), [
    'ingredients[0].quantity',
    'ingredients[1].quantity',
    'ingredients[2].quantity',
    'ingredients[3].quantity',
    'ingredients[4].name',
    'ingredients[5].unit',
  ]);
});

test('detecta ingredientes repetidos sin distinguir mayusculas ni tildes', () => {
  const error = failure(
    validBody({
      ingredients: [
        { name: 'Azúcar', quantity: 100, unit: 'g' },
        { name: 'azucar', quantity: 50, unit: 'g' },
      ],
    })
  );
  assert.deepEqual(fieldsOf(error), ['ingredients[1].name']);
});

test('rechaza cuerpos que no son un objeto JSON', () => {
  for (const body of [undefined, null, [], 'texto', 42]) {
    const error = failure(body);
    assert.ok(error instanceof HttpError);
    assert.equal(error.status, 400);
  }
});

test('la descripcion admite saltos de linea pero no otros caracteres de control', () => {
  const multiline = 'Primera linea de la receta.\nSegunda linea de la receta.';
  assert.equal(validateRecipeInput(validBody({ description: multiline })).description, multiline);
  assert.deepEqual(
    fieldsOf(failure(validBody({ description: 'Texto con un caracter\u0007 de control' }))),
    ['description']
  );
});

test('la unidad es opcional y por defecto queda vacia', () => {
  const result = validateRecipeInput(
    validBody({
      ingredients: [
        { name: 'Sal', quantity: 1 },
        { name: 'Pimienta', quantity: 1, unit: null },
      ],
    })
  );
  assert.deepEqual(
    result.ingredients.map((item) => item.unit),
    ['', '']
  );
});