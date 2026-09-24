import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

/**
 * Sync system notifications with PostgreSQL state
 * Preserves user's read and dismissed statuses!
 */
export const syncNotifications = async (clientOrPool) => {
  const db = clientOrPool || pool;

  // 1. Sync Low Stock / Out of Stock alerts
  const lowStockProducts = await db.query(`
    SELECT id, name, stock, min_stock 
    FROM products 
    WHERE stock <= min_stock
  `);

  for (const p of lowStockProducts.rows) {
    const notifId = `stock-${p.id}`;
    const isOut = Number(p.stock) === 0;
    const type = isOut ? 'danger' : 'warning';
    const title = isOut ? `🚨 Producto Agotado: ${p.name}` : `⚠️ Stock Bajo: ${p.name}`;
    const message = isOut
      ? 'No quedan existencias disponibles en almacén.'
      : `Quedan solo ${p.stock} unidades en inventario (Mínimo: ${p.min_stock}).`;

    await db.query(
      `INSERT INTO notifications (id, type, title, message, time, link_tab, link_id, read, dismissed)
       VALUES ($1, $2, $3, $4, 'Inventario', 'inventory', $5, FALSE, FALSE)
       ON CONFLICT (id) DO UPDATE 
         SET title = EXCLUDED.title,
             message = EXCLUDED.message,
             type = EXCLUDED.type`,
      [notifId, type, title, message, String(p.id)]
    );
  }

  // Remove stock alerts for products that are no longer low on stock
  await db.query(`
    DELETE FROM notifications 
    WHERE id LIKE 'stock-%' 
      AND id NOT IN (SELECT 'stock-' || id FROM products WHERE stock <= min_stock)
  `);

  // 2. Sync Recent Sales (Last 10 orders)
  const recentOrders = await db.query(`
    SELECT id, order_number, customer_name, total, TO_CHAR(created_at, 'HH24:MI') AS "time"
    FROM orders
    ORDER BY created_at DESC
    LIMIT 10
  `);

  for (const o of recentOrders.rows) {
    const notifId = `sale-${o.id}`;
    const title = `Venta ${o.order_number}`;
    const message = `${o.customer_name || 'Consumidor Final'} — Total: $${Number(o.total).toFixed(2)}`;

    await db.query(
      `INSERT INTO notifications (id, type, title, message, time, link_tab, link_id, read, dismissed)
       VALUES ($1, 'success', $2, $3, $4, 'sales', $5, FALSE, FALSE)
       ON CONFLICT (id) DO NOTHING`,
      [notifId, title, message, `${o.time} hrs`, String(o.id)]
    );
  }

  // 3. Sync Pending Debts / Cuentas por cobrar
  const pendingDebts = await db.query(`
    SELECT id, order_number, customer_name, balance_due
    FROM orders
    WHERE balance_due > 0 AND status != 'Cancelado'
    LIMIT 10
  `);

  for (const d of pendingDebts.rows) {
    const notifId = `debt-${d.id}`;
    const title = `Cuenta Pendiente: ${d.customer_name}`;
    const message = `Saldo por cobrar: $${Number(d.balance_due).toFixed(2)} (Orden ${d.order_number})`;

    await db.query(
      `INSERT INTO notifications (id, type, title, message, time, link_tab, link_id, read, dismissed)
       VALUES ($1, 'info', $2, $3, 'Crédito', 'dashboard', $4, FALSE, FALSE)
       ON CONFLICT (id) DO UPDATE 
         SET message = EXCLUDED.message`,
      [notifId, title, message, String(d.id)]
    );
  }

  // Clean up debts that have been fully paid
  await db.query(`
    DELETE FROM notifications 
    WHERE id LIKE 'debt-%' 
      AND id NOT IN (SELECT 'debt-' || id FROM orders WHERE balance_due > 0 AND status != 'Cancelado')
  `);
};

// GET all notifications
router.get('/', async (req, res) => {
  try {
    await syncNotifications(pool);

    const result = await pool.query(`
      SELECT 
        id, 
        type, 
        title, 
        message, 
        time, 
        link_tab AS "linkTab", 
        link_id AS "linkId", 
        read, 
        dismissed, 
        created_at AS "createdAt"
      FROM notifications
      WHERE dismissed = FALSE
      ORDER BY created_at DESC
      LIMIT 25
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// PUT mark all as read
router.put('/read-all', async (req, res) => {
  try {
    await pool.query(`
      UPDATE notifications 
      SET read = TRUE 
      WHERE dismissed = FALSE
    `);

    res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Error al marcar notificaciones como leídas' });
  }
});

// PUT mark single as read
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE notifications 
       SET read = TRUE 
       WHERE id = $1`,
      [id]
    );

    res.json({ success: true, id });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Error al marcar notificación como leída' });
  }
});

// DELETE clear/dismiss all notifications
router.delete('/clear', async (req, res) => {
  try {
    await pool.query(`
      UPDATE notifications 
      SET dismissed = TRUE 
      WHERE dismissed = FALSE
    `);

    res.json({ success: true, message: 'Notificaciones limpiadas con éxito' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ error: 'Error al limpiar notificaciones' });
  }
});

// DELETE dismiss single notification
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE notifications 
       SET dismissed = TRUE 
       WHERE id = $1`,
      [id]
    );

    res.json({ success: true, id });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
});

export default router;
