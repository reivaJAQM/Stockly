import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET all expenses
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        concept,
        category,
        amount,
        TO_CHAR(date, 'YYYY-MM-DD') AS "date",
        payment_method AS "paymentMethod",
        supplier,
        notes,
        created_at AS "createdAt"
      FROM expenses
      ORDER BY date DESC, id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Error al obtener gastos' });
  }
});

// POST create expense
router.post('/', async (req, res) => {
  const {
    concept,
    category,
    amount,
    date,
    paymentMethod,
    supplier,
    notes
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO expenses (concept, category, amount, date, payment_method, supplier, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING 
        id, concept, category, amount,
        TO_CHAR(date, 'YYYY-MM-DD') AS "date",
        payment_method AS "paymentMethod",
        supplier, notes`,
      [
        concept,
        category || 'Otros',
        Number(amount || 0),
        date || new Date().toISOString().split('T')[0],
        paymentMethod || 'Efectivo',
        supplier || '',
        notes || ''
      ]
    );

    const newExpense = result.rows[0];

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (type, title) VALUES ('expense', $1)`,
      [`Gasto registrado: ${newExpense.concept} ($${Number(newExpense.amount).toFixed(2)})`]
    );

    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Error al registrar gasto' });
  }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING concept', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }
    res.json({ message: 'Gasto eliminado', concept: result.rows[0].concept });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Error al eliminar gasto' });
  }
});

export default router;
