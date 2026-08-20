import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET all sales / orders
router.get('/', async (req, res) => {
  try {
    const ordersRes = await pool.query(`
      SELECT 
        o.id AS db_id,
        o.order_number AS "id",
        o.customer_id AS "customerId",
        json_build_object(
          'name', COALESCE(o.customer_name, 'Cliente Mostrador'),
          'email', COALESCE(o.customer_email, 'general@cliente.com'),
          'phone', COALESCE(o.customer_phone, 'N/A')
        ) AS "customer",
        TO_CHAR(o.created_at, 'DD Mon YYYY') AS "date",
        COALESCE(o.subtotal, 0)::numeric(12,2) AS subtotal,
        COALESCE(o.tax, 0)::numeric(12,2) AS tax,
        COALESCE(o.discount, 0)::numeric(12,2) AS discount,
        COALESCE(o.total, 0)::numeric(12,2) AS total,
        o.payment_method AS "paymentMethod",
        o.channel,
        o.status,
        o.created_at AS "createdAt"
      FROM orders o
      ORDER BY o.created_at DESC
    `);

    // Fetch items for each order
    const orders = ordersRes.rows.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal) || 0,
      total: Number(o.total) || 0,
      discount: Number(o.discount) || 0,
      tax: Number(o.tax) || 0,
      items: []
    }));

    if (orders.length > 0) {
      const itemsRes = await pool.query(`
        SELECT 
          order_id,
          product_id AS "productId",
          product_name AS "name",
          quantity,
          unit_price AS "price",
          subtotal
        FROM order_items
      `);

      const itemsByOrder = itemsRes.rows.reduce((acc, item) => {
        if (!acc[item.order_id]) acc[item.order_id] = [];
        acc[item.order_id].push({
          productId: item.productId,
          name: item.name,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
          subtotal: Number(item.subtotal) || 0
        });
        return acc;
      }, {});

      orders.forEach((order) => {
        order.items = itemsByOrder[order.db_id] || [];
      });
    }

    res.json(orders);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

// POST create sale (ATOMIC TRANSACTION)
router.post('/', async (req, res) => {
  const {
    customer,
    items,
    subtotal,
    tax,
    discount,
    total,
    paymentMethod,
    channel
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'La orden debe contener al menos un producto' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Generate sequential order number starting from 1 (#ORD-00001, #ORD-00002...)
    const countRes = await client.query('SELECT COUNT(*) FROM orders');
    const nextNum = (parseInt(countRes.rows[0].count, 10) + 1).toString().padStart(5, '0');
    const orderNumber = `#ORD-${nextNum}`;

    // 2. Insert Order
    const orderRes = await client.query(
      `INSERT INTO orders (
        order_number, customer_id, customer_name, customer_email, customer_phone,
        subtotal, tax, discount, total, payment_method, channel, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Completado')
      RETURNING id AS db_id, order_number AS "id", subtotal, tax, discount, total, payment_method AS "paymentMethod", channel, status, created_at AS "createdAt"`,
      [
        orderNumber,
        customer?.id ? Number(customer.id) : null,
        customer?.name || 'Cliente Mostrador',
        customer?.email || 'general@cliente.com',
        customer?.phone || 'N/A',
        Number(subtotal || total || 0),
        Number(tax || 0),
        Number(discount || 0),
        Number(total || 0),
        paymentMethod || 'Efectivo',
        channel || 'Venta Directa'
      ]
    );

    const createdOrder = orderRes.rows[0];
    const orderId = createdOrder.db_id; // numeric primary key for foreign keys

    // 3. Insert order items & update product stocks
    const createdItems = [];
    for (const item of items) {
      const itemSubtotal = Number(item.price) * Number(item.quantity);
      
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          orderId,
          item.productId ? Number(item.productId) : null,
          item.name,
          Number(item.quantity),
          Number(item.price),
          itemSubtotal
        ]
      );

      // Decrement stock & increment units_sold & total_revenue in products table
      if (item.productId) {
        await client.query(
          `UPDATE products 
           SET stock = GREATEST(0, stock - $1),
               units_sold = COALESCE(units_sold, 0) + $1,
               total_revenue = COALESCE(total_revenue, 0) + $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [Number(item.quantity), itemSubtotal, Number(item.productId)]
        );

        // Record stock movement
        await client.query(
          `INSERT INTO stock_movements (product_id, type, quantity, reason)
           VALUES ($1, 'venta', $2, $3)`,
          [Number(item.productId), Number(item.quantity), `Venta en orden ${orderNumber}`]
        );
      }

      createdItems.push({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      });
    }

    // 4. Log activity
    await client.query(
      `INSERT INTO activity_logs (type, title)
       VALUES ('sale', $1)`,
      [`Nueva venta ${orderNumber} ($${Number(total).toFixed(2)})`]
    );

    await client.query('COMMIT');

    const formattedOrder = {
      ...createdOrder,
      customer: {
        name: customer?.name || 'Cliente Mostrador',
        email: customer?.email || 'general@cliente.com',
        phone: customer?.phone || 'N/A'
      },
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      items: createdItems
    };

    res.status(201).json(formattedOrder);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Error al procesar la venta' });
  } finally {
    client.release();
  }
});

// PUT update order status
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE orders 
       SET status = $1 
       WHERE order_number = $2 OR id::text = $2
       RETURNING order_number AS "id", status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Error al actualizar estado de orden' });
  }
});

export default router;
