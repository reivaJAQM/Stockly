import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET all services (with real-time aggregated sales & revenue from active orders)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.category,
        COALESCE(s.default_price, 0)::numeric(12,2) AS "defaultPrice",
        COALESCE(SUM(oi.quantity), 0)::int AS "totalSales",
        COALESCE(SUM(oi.subtotal), 0)::numeric(12,2) AS "totalRevenue",
        s.created_at AS "createdAt",
        s.updated_at AS "updatedAt"
      FROM services s
      LEFT JOIN order_items oi ON (oi.service_id = s.id OR (oi.product_id IS NULL AND LOWER(oi.product_name) = LOWER(s.name)))
      GROUP BY s.id, s.name, s.category, s.default_price, s.created_at, s.updated_at
      ORDER BY s.name ASC
    `);

    const formatted = result.rows.map((row) => ({
      ...row,
      defaultPrice: Number(row.defaultPrice),
      totalSales: Number(row.totalSales || 0),
      totalRevenue: Number(row.totalRevenue || 0)
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error al obtener servicios:', err);
    res.status(500).json({ error: 'Error al consultar catálogo de servicios' });
  }
});

// POST create service
router.post('/', async (req, res) => {
  const { name, category, defaultPrice } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre del servicio es obligatorio' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO services (name, category, default_price)
       VALUES ($1, $2, $3)
       RETURNING id, name, category, default_price::numeric(12,2) AS "defaultPrice",
                 total_sales AS "totalSales", total_revenue::numeric(12,2) AS "totalRevenue",
                 created_at AS "createdAt"`,
      [
        name.trim(),
        category?.trim() || 'Servicios',
        Number(defaultPrice || 0)
      ]
    );

    const created = result.rows[0];
    created.defaultPrice = Number(created.defaultPrice);
    created.totalRevenue = Number(created.totalRevenue || 0);

    res.status(201).json(created);
  } catch (err) {
    console.error('Error al registrar servicio:', err);
    res.status(500).json({ error: 'Error al guardar servicio en la base de datos' });
  }
});

// PUT update service
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, defaultPrice } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre del servicio es obligatorio' });
  }

  try {
    const result = await pool.query(
      `UPDATE services
       SET name = $1,
           category = $2,
           default_price = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, category, default_price::numeric(12,2) AS "defaultPrice",
                 total_sales AS "totalSales", total_revenue::numeric(12,2) AS "totalRevenue",
                 updated_at AS "updatedAt"`,
      [
        name.trim(),
        category?.trim() || 'Servicios',
        Number(defaultPrice || 0),
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const updated = result.rows[0];
    updated.defaultPrice = Number(updated.defaultPrice);
    updated.totalRevenue = Number(updated.totalRevenue || 0);

    res.json(updated);
  } catch (err) {
    console.error('Error al actualizar servicio:', err);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
});

// DELETE service
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM services WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.json({ message: 'Servicio eliminado correctamente', id });
  } catch (err) {
    console.error('Error al eliminar servicio:', err);
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
});

export default router;
