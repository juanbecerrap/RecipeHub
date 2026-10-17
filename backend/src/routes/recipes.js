// backend/src/routes/recipes.js

import { Router } from 'express';
import { pool } from '../db.js';
import { HttpError } from '../errors.js';
import { parseId } from '../validators.js';

const router = Router();

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const MAX_SEARCH_LENGTH = 100;

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
    `SELECT r.id, r.title, r.description,
            r.image_path AS imagePath,
            r.preparation_time AS preparationTime,
            r.difficulty, r.servings,
            c.id AS categoryId, c.name AS categoryName, c.slug AS categorySlug
     FROM recipes AS r
     JOIN categories AS c ON c.id = r.category_id
     ${where}
     ORDER BY r.title`,
    params
  );

  res.json({ ok: true, data: rows.map(toRecipeSummary) });
});

export default router;