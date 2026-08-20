import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET dashboard consolidated stats & activity
router.get('/stats', async (req, res) => {
  try {
    // 1. Total Sales & Orders
    const salesRes = await pool.query(`
      SELECT 
        COALESCE(SUM(total), 0) AS "totalSales",
        COUNT(id) AS "ordersCount"
      FROM orders
      WHERE status != 'Cancelado'
    `);

    // 2. Customers Count
    const custRes = await pool.query('SELECT COUNT(id) AS "newCustomersCount" FROM customers');

    // 3. Products sold & Total inventory
    const prodRes = await pool.query(`
      SELECT 
        COALESCE(SUM(units_sold), 0) AS "productsSoldCount",
        COALESCE(SUM(stock), 0) AS "totalStockUnits"
      FROM products
    `);

    // 4. Total Expenses
    const expRes = await pool.query('SELECT COALESCE(SUM(amount), 0) AS "totalExpenses" FROM expenses');

    // 5. Channel Breakdown
    const channelRes = await pool.query(`
      SELECT 
        channel,
        COALESCE(SUM(total), 0) AS total_amount
      FROM orders
      WHERE status != 'Cancelado'
      GROUP BY channel
    `);

    const totalSales = Number(salesRes.rows[0].totalSales);
    const channelsMap = {
      'Tienda física': { id: 'physical', color: '#3b82f6' },
      'Tienda online': { id: 'online', color: '#10b981' },
      'Marketplace': { id: 'marketplace', color: '#f59e0b' }
    };

    const channels = ['Tienda física', 'Tienda online', 'Marketplace'].map((chName) => {
      const found = channelRes.rows.find((r) => r.channel === chName);
      const amount = found ? Number(found.total_amount) : 0;
      const percentage = totalSales > 0 ? Number(((amount / totalSales) * 100).toFixed(1)) : 0;
      return {
        id: channelsMap[chName].id,
        name: chName,
        amount,
        percentage,
        color: channelsMap[chName].color
      };
    });

    // 6. Recent Activities
    const actRes = await pool.query(`
      SELECT 
        id,
        type,
        title,
        TO_CHAR(created_at, 'HH24:MI - DD Mon') AS "time"
      FROM activity_logs
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // 7. Daily sales chart data for last 30 days
    const chartRes = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') AS "dateKey",
        TO_CHAR(created_at, 'DD Mon') AS "date",
        COALESCE(SUM(total), 0)::numeric(12,2) AS "value"
      FROM orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND status != 'Cancelado'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD'), TO_CHAR(created_at, 'DD Mon'), DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at) ASC
    `);

    // 8. Dynamic Notifications (Low Stock, Out of Stock, Recent Sales)
    const lowStockRes = await pool.query(`
      SELECT id, name, stock, min_stock 
      FROM products 
      WHERE stock <= min_stock 
      ORDER BY stock ASC 
      LIMIT 5
    `);

    const recentOrdersRes = await pool.query(`
      SELECT id, order_number, customer_name, total, TO_CHAR(created_at, 'HH24:MI') AS "time"
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const notifications = [];

    lowStockRes.rows.forEach((p) => {
      notifications.push({
        id: `stock-${p.id}`,
        type: p.stock === 0 ? 'warning' : 'warning',
        title: p.stock === 0 ? `🚨 Producto Agotado: ${p.name}` : `⚠️ Stock Bajo: ${p.name}`,
        message: p.stock === 0 ? 'No quedan existencias disponibles.' : `Quedan solo ${p.stock} unidades en inventario (Mínimo: ${p.min_stock}).`,
        time: 'Inventario',
        read: false
      });
    });

    recentOrdersRes.rows.forEach((o) => {
      notifications.push({
        id: `sale-${o.id}`,
        type: 'success',
        title: `Venta ${o.order_number}`,
        message: `${o.customer_name} — Total: $${Number(o.total).toFixed(2)}`,
        time: `${o.time} hrs`,
        read: false
      });
    });

    res.json({
      kpis: {
        totalSales,
        totalSalesGrowth: 0,
        ordersCount: Number(salesRes.rows[0].ordersCount),
        ordersGrowth: 0,
        newCustomersCount: Number(custRes.rows[0].newCustomersCount),
        customersGrowth: 0,
        productsSoldCount: Number(prodRes.rows[0].productsSoldCount),
        productsGrowth: 0,
        totalExpenses: Number(expRes.rows[0].totalExpenses)
      },
      salesChannels: {
        total: totalSales,
        channels
      },
      salesChartData: chartRes.rows,
      activityLog: actRes.rows,
      notifications
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas del dashboard' });
  }
});

export default router;
