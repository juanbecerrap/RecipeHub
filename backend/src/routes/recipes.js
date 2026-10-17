// backend/src/routes/recipes.js

import { Router } from 'express';
import { pool } from '../db.js';
import { HttpError } from '../errors.js';
import { parseId } from '../validators.js';
import { DIFFICULTIES, validateRecipeInput } from '../recipeValidator.js';

const router = Router();

const MAX_SEARCH_LENGTH = 100;

// Columnas comunes del listado y del detalle (fragmento fijo, sin datos del usuario)
const SUMMARY_COLUMNS = `
  r.id, r.title, r.description,
  r.image_path AS imagePath,
  r.preparation_time AS preparationTime,
  r.difficulty, r.servings,
  c.id AS categoryId, c.name AS categoryName, c.slug AS categorySlug`;

// Un parametro de la URL debe ser un unico texto (no repetido).
const singleParam = (value, name) => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new HttpError(400, `El parametro ${name} no es valido`);
  }
  return value.trim();
};

const toRecipeSummary = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  imagePath: row.imagePath,
  preparationTime: row.preparationTime,
  difficulty: row.difficulty,
  servings: row.servings,
  category: {
    id: row.categoryId,
    name: row.categoryName,
    slug: row.categorySlug,
  },
});

// Las instrucciones se guardan con un paso por linea
const toSteps = (text) =>
  text
    .split(/\r?\n/)
    .map((step) => step.trim())
    .filter(Boolean);

// Devuelve la receta completa o null. Acepta el pool o una conexion.
const findRecipeById = async (executor, id) => {
  const [recipes] = await executor.execute(
    `SELECT ${SUMMARY_COLUMNS},
            r.instructions,
            r.created_at AS createdAt,
            r.updated_at AS updatedAt
     FROM recipes AS r
     JOIN categories AS c ON c.id = r.category_id
     WHERE r.id = ?`,
    [id]
  );

  if (recipes.length === 0) {
    return null;
  }

  const [ingredients] = await executor.execute(
    `SELECT i.id, i.name, ri.quantity, ri.unit
     FROM recipe_ingredients AS ri
     JOIN ingredients AS i ON i.id = ri.ingredient_id
     WHERE ri.recipe_id = ?
     ORDER BY i.name`,
    [id]
  );

  const row = recipes[0];
  return {
    ...toRecipeSummary(row),
    instructions: toSteps(row.instructions),
    ingredients,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

// Guarda los ingredientes de una receta dentro de una transaccion ya abierta.
const saveIngredients = async (connection, recipeId, ingredients) => {
  for (const item of ingredients) {
    // Si el nombre ya existe (sin distinguir mayusculas ni tildes) se reutiliza su id
    const [result] = await connection.execute(
      `INSERT INTO ingredients (name) VALUES (?)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      [item.name]
    );
    await connection.execute(
      `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
       VALUES (?, ?, ?, ?)`,
      [recipeId, result.insertId, item.quantity, item.unit]
    );
  }
};

// GET /api/recipes?search=&category=&difficulty=
router.get('/', async (req, res) => {
  const search = singleParam(req.query.search, 'search');
  const category = singleParam(req.query.category, 'category');
  const difficulty = singleParam(req.query.difficulty, 'difficulty');

  const conditions = [];
  const params = [];

  if (search) {
    if (search.length > MAX_SEARCH_LENGTH) {
      throw new HttpError(
        400,
        `El parametro search admite como maximo ${MAX_SEARCH_LENGTH} caracteres`
      );
    }
    // Se escapan los comodines para buscar el texto tal cual
    const escaped = search.replace(/[!%_]/g, '!$&');
    conditions.push("r.title LIKE ? ESCAPE '!'");
    params.push(`%${escaped}%`);
  }

  if (category) {
    conditions.push('r.category_id = ?');
    params.push(parseId(category, 'category'));
  }

  if (difficulty) {
    if (!DIFFICULTIES.includes(difficulty)) {
      throw new HttpError(
        400,
        'El parametro difficulty debe ser easy, medium o hard'
      );
    }
    conditions.push('r.difficulty = ?');
    params.push(difficulty);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `SELECT ${SUMMARY_COLUMNS}
     FROM recipes AS r
     JOIN categories AS c ON c.id = r.category_id
     ${where}
     ORDER BY r.title`,
    params
  );

  res.json({ ok: true, data: rows.map(toRecipeSummary) });
});

// GET /api/recipes/:id
router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id, 'id');
  const recipe = await findRecipeById(pool, id);

  if (!recipe) {
    throw new HttpError(404, 'Receta no encontrada');
  }

  res.json({ ok: true, data: recipe });
});

// POST /api/recipes
router.post('/', async (req, res) => {
  const data = validateRecipeInput(req.body);

  const connection = await pool.getConnection();
  let recipeId;

  try {
    await connection.beginTransaction();

    const [categories] = await connection.execute(
      'SELECT id FROM categories WHERE id = ?',
      [data.categoryId]
    );
    if (categories.length === 0) {
      throw new HttpError(422, 'Los datos de la receta no son validos', [
        { field: 'categoryId', message: 'La categoria no existe' },
      ]);
    }

    const [result] = await connection.execute(
      `INSERT INTO recipes
         (title, description, image_path, preparation_time, difficulty,
          servings, instructions, category_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.description,
        data.imagePath,
        data.preparationTime,
        data.difficulty,
        data.servings,
        data.instructions.join('\n'),
        data.categoryId,
      ]
    );
    recipeId = result.insertId;

    await saveIngredients(connection, recipeId, data.ingredients);

    await connection.commit();
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // la conexion puede haberse perdido; se libera igualmente
    }
    if (error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(422, 'Los datos de la receta no son validos', [
        { field: 'ingredients', message: 'Hay ingredientes repetidos en la receta' },
      ]);
    }
    throw error;
  } finally {
    connection.release();
  }

  const recipe = await findRecipeById(pool, recipeId);
  res.status(201).location(`/api/recipes/${recipeId}`).json({ ok: true, data: recipe });
});

export default router;