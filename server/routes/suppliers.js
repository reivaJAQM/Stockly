import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET all suppliers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        contact_name AS "contactName",
        email,
        phone,
        category,
        created_at AS "createdAt"
      FROM suppliers
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

// POST create supplier
router.post('/', async (req, res) => {
  const { name, contactName, email, phone, category } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO suppliers (name, contact_name, email, phone, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, contact_name AS "contactName", email, phone, category`,
      [name, contactName || '', email || '', phone || '', category || 'General']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
});

export default router;
