// backend/src/routes/categories.js

import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, name, slug FROM categories ORDER BY name'
  );
  res.json({ ok: true, data: rows });
});

export default router;