import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET all customers with aggregated spending and debt
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.notes,
        TO_CHAR(c.created_at, 'DD Mon YYYY') AS "joinedDate",
        COALESCE(SUM(o.total), 0)::numeric(12,2) AS "totalSpent",
        COALESCE(SUM(o.balance_due), 0)::numeric(12,2) AS "totalDebt",
        COUNT(o.id) AS "totalOrders"
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.id DESC
    `);
    
    const customers = result.rows.map((c) => ({
      ...c,
      totalSpent: Number(c.totalSpent) || 0,
      totalDebt: Number(c.totalDebt) || 0,
      totalOrders: Number(c.totalOrders) || 0
    }));

    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// POST create customer
router.post('/', async (req, res) => {
  const { name, email, phone, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO customers (name, email, phone, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone, notes, TO_CHAR(created_at, 'DD Mon YYYY') AS "joinedDate"`,
      [name, email || '', phone || '', notes || '']
    );

    const newCust = {
      ...result.rows[0],
      totalSpent: 0,
      totalOrders: 0
    };

    await pool.query(
      `INSERT INTO activity_logs (type, title) VALUES ('customer', $1)`,
      [`Nuevo cliente registrado: ${newCust.name}`]
    );

    res.status(201).json(newCust);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE customers
       SET name = $1, email = $2, phone = $3, notes = $4
       WHERE id = $5
       RETURNING id, name, email, phone, notes, TO_CHAR(created_at, 'DD Mon YYYY') AS "joinedDate"`,
      [name, email || '', phone || '', notes || '', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

export default router;
