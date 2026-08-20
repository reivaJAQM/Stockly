import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET all categories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        color,
        created_at AS "createdAt"
      FROM categories
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// POST create category
router.post('/', async (req, res) => {
  const { name, color } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre de la categoría es requerido' });
  }

  const cleanName = name.trim();
  const categoryColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];
  const assignedColor = color || categoryColors[Math.floor(Math.random() * categoryColors.length)];

  try {
    const result = await pool.query(
      `INSERT INTO categories (name, color)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color
       RETURNING id, name, color, created_at AS "createdAt"`,
      [cleanName, assignedColor]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Error al crear la categoría' });
  }
});

// DELETE category
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

export default router;
