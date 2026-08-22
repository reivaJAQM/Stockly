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
          'id', o.customer_id,
          'name', COALESCE(o.customer_name, 'Cliente Mostrador'),
          'email', COALESCE(o.customer_email, 'general@cliente.com'),
          'phone', COALESCE(o.customer_phone, 'N/A')
        ) AS "customer",
        TO_CHAR(o.created_at, 'DD Mon YYYY') AS "date",
        COALESCE(o.subtotal, 0)::numeric(12,2) AS subtotal,
        COALESCE(o.tax, 0)::numeric(12,2) AS tax,
        COALESCE(o.discount, 0)::numeric(12,2) AS discount,
        COALESCE(o.total, 0)::numeric(12,2) AS total,
        COALESCE(o.amount_paid, o.total)::numeric(12,2) AS "amountPaid",
        COALESCE(o.balance_due, 0)::numeric(12,2) AS "balanceDue",
        o.payment_method AS "paymentMethod",
        o.channel,
        o.status,
        o.created_at AS "createdAt"
      FROM orders o
      ORDER BY o.created_at DESC
    `);

    // Fetch items and payments for each order
    const orders = ordersRes.rows.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal) || 0,
      total: Number(o.total) || 0,
      discount: Number(o.discount) || 0,
      tax: Number(o.tax) || 0,
      amountPaid: Number(o.amountPaid) || 0,
      balanceDue: Number(o.balanceDue) || 0,
      items: [],
      payments: []
    }));

    if (orders.length > 0) {
      // Order items
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

      // Order payments (abonos)
      const paymentsRes = await pool.query(`
        SELECT 
          id,
          order_id,
          amount::numeric(12,2) AS amount,
          payment_method AS "paymentMethod",
          notes,
          created_at AS "createdAt",
          TO_CHAR(created_at, 'DD Mon YYYY, HH24:MI') AS "formattedDate"
        FROM order_payments
        ORDER BY created_at ASC
      `);

      const paymentsByOrder = paymentsRes.rows.reduce((acc, pay) => {
        if (!acc[pay.order_id]) acc[pay.order_id] = [];
        acc[pay.order_id].push({
          id: pay.id,
          amount: Number(pay.amount) || 0,
          paymentMethod: pay.paymentMethod,
          notes: pay.notes || '',
          createdAt: pay.createdAt,
          formattedDate: pay.formattedDate
        });
        return acc;
      }, {});

      orders.forEach((order) => {
        order.items = itemsByOrder[order.db_id] || [];
        order.payments = paymentsByOrder[order.db_id] || [];
      });
    }

    res.json(orders);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

// POST create sale (ATOMIC TRANSACTION with Credit / Fiado support)
router.post('/', async (req, res) => {
  const {
    customer,
    items,
    subtotal,
    tax,
    discount,
    total,
    paymentMethod,
    initialPayment,
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

    const numTotal = Number(total || 0);
    const isCredit = paymentMethod === 'Crédito' || paymentMethod === 'Crédito / Fiado';
    const initPay = isCredit ? Math.min(numTotal, Math.max(0, Number(initialPayment || 0))) : numTotal;
    const balanceDue = isCredit ? Math.max(0, numTotal - initPay) : 0;
    const initialStatus = balanceDue <= 0 ? 'Completado' : 'Pendiente';

    // 2. Insert Order
    const orderRes = await client.query(
      `INSERT INTO orders (
        order_number, customer_id, customer_name, customer_email, customer_phone,
        subtotal, tax, discount, total, amount_paid, balance_due, payment_method, channel, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id AS db_id, order_number AS "id", subtotal, tax, discount, total, 
                amount_paid AS "amountPaid", balance_due AS "balanceDue", 
                payment_method AS "paymentMethod", channel, status, created_at AS "createdAt"`,
      [
        orderNumber,
        customer?.id ? Number(customer.id) : null,
        customer?.name || 'Cliente Mostrador',
        customer?.email || 'general@cliente.com',
        customer?.phone || 'N/A',
        Number(subtotal || total || 0),
        Number(tax || 0),
        Number(discount || 0),
        numTotal,
        initPay,
        balanceDue,
        paymentMethod || 'Efectivo',
        channel || 'Venta Directa',
        initialStatus
      ]
    );

    const createdOrder = orderRes.rows[0];
    const orderId = createdOrder.db_id; // numeric primary key

    // 2.1. If initial payment exists, register it in order_payments
    const createdPayments = [];
    if (initPay > 0) {
      const payRes = await client.query(
        `INSERT INTO order_payments (order_id, amount, payment_method, notes)
         VALUES ($1, $2, $3, $4)
         RETURNING id, amount, payment_method AS "paymentMethod", notes, created_at AS "createdAt"`,
        [
          orderId,
          initPay,
          isCredit ? 'Efectivo' : (paymentMethod || 'Efectivo'),
          isCredit ? 'Abono inicial al momento de la venta' : 'Pago completo al contado'
        ]
      );
      createdPayments.push({
        id: payRes.rows[0].id,
        amount: Number(payRes.rows[0].amount),
        paymentMethod: payRes.rows[0].paymentMethod,
        notes: payRes.rows[0].notes,
        createdAt: payRes.rows[0].createdAt,
        formattedDate: 'Hoy'
      });
    }

    // 3. Insert order items & update product stocks
    const createdItems = [];
    for (const item of items) {
      const itemSubtotal = Number(item.price) * Number(item.quantity);
      const isProduct = item.productId && !item.isService;
      const srvId = item.serviceId || (item.isService && !item.productId ? Number(item.id || null) : null);
      
      await client.query(
        `INSERT INTO order_items (order_id, product_id, service_id, product_name, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orderId,
          isProduct ? Number(item.productId) : null,
          srvId ? Number(srvId) : null,
          item.name,
          Number(item.quantity),
          Number(item.price),
          itemSubtotal
        ]
      );

      // If it's a physical product, decrement stock & increment units_sold & total_revenue in products table
      if (isProduct) {
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
        productId: isProduct ? item.productId : null,
        serviceId: srvId,
        isService: !isProduct,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: itemSubtotal
      });
    }

    // 4. Log activity
    const activityDesc = isCredit
      ? `Nueva venta a crédito ${orderNumber} (${customer?.name || 'Cliente'}). Total: $${numTotal.toFixed(2)}, Debe: $${balanceDue.toFixed(2)}`
      : `Nueva venta ${orderNumber} ($${numTotal.toFixed(2)})`;

    await client.query(
      `INSERT INTO activity_logs (type, title)
       VALUES ('sale', $1)`,
      [activityDesc]
    );

    await client.query('COMMIT');

    const formattedOrder = {
      ...createdOrder,
      subtotal: Number(createdOrder.subtotal),
      tax: Number(createdOrder.tax),
      discount: Number(createdOrder.discount),
      total: Number(createdOrder.total),
      amountPaid: Number(createdOrder.amountPaid),
      balanceDue: Number(createdOrder.balanceDue),
      customer: {
        id: customer?.id || null,
        name: customer?.name || 'Cliente Mostrador',
        email: customer?.email || 'general@cliente.com',
        phone: customer?.phone || 'N/A'
      },
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      items: createdItems,
      payments: createdPayments
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

// POST add payment / abono to an order
router.post('/:id/payments', async (req, res) => {
  const { id } = req.params;
  const { amount, paymentMethod, notes } = req.body;

  const payAmount = Number(amount);
  if (!payAmount || payAmount <= 0) {
    return res.status(400).json({ error: 'El monto del abono debe ser mayor a 0' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Find and lock order
    const orderRes = await client.query(
      `SELECT id, order_number, customer_name, total, amount_paid, balance_due, status 
       FROM orders 
       WHERE order_number = $1 OR id::text = $1 FOR UPDATE`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const order = orderRes.rows[0];
    const orderDbId = order.id;
    const currentBalance = Number(order.balance_due || 0);

    if (currentBalance <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Esta orden ya se encuentra totalmente saldada' });
    }

    const actualPayAmount = Math.min(payAmount, currentBalance);
    const newAmountPaid = Number(order.amount_paid || 0) + actualPayAmount;
    const newBalanceDue = Math.max(0, currentBalance - actualPayAmount);
    const newStatus = newBalanceDue <= 0 ? 'Completado' : 'Pendiente';

    // 2. Insert Payment
    const paymentRes = await client.query(
      `INSERT INTO order_payments (order_id, amount, payment_method, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, amount, payment_method AS "paymentMethod", notes, created_at AS "createdAt",
                 TO_CHAR(created_at, 'DD Mon YYYY, HH24:MI') AS "formattedDate"`,
      [
        orderDbId,
        actualPayAmount,
        paymentMethod || 'Efectivo',
        notes || (newBalanceDue === 0 ? 'Liquidación total de la deuda' : 'Abono a cuenta')
      ]
    );

    // 3. Update Order
    await client.query(
      `UPDATE orders 
       SET amount_paid = $1, balance_due = $2, status = $3
       WHERE id = $4`,
      [newAmountPaid, newBalanceDue, newStatus, orderDbId]
    );

    // 4. Activity Log
    await client.query(
      `INSERT INTO activity_logs (type, title)
       VALUES ('sale', $1)`,
      [
        `Abono de $${actualPayAmount.toFixed(2)} recibido para ${order.order_number} (${order.customer_name || 'Cliente'}). ${
          newBalanceDue === 0 ? '¡Deuda saldada al 100%!' : `Resta: $${newBalanceDue.toFixed(2)}`
        }`
      ]
    );

    await client.query('COMMIT');

    // 5. Fetch updated full order with items and all payments
    const updatedOrderRes = await pool.query(
      `SELECT 
        o.id AS db_id,
        o.order_number AS "id",
        o.customer_id AS "customerId",
        json_build_object(
          'id', o.customer_id,
          'name', COALESCE(o.customer_name, 'Cliente Mostrador'),
          'email', COALESCE(o.customer_email, 'general@cliente.com'),
          'phone', COALESCE(o.customer_phone, 'N/A')
        ) AS "customer",
        TO_CHAR(o.created_at, 'DD Mon YYYY') AS "date",
        COALESCE(o.subtotal, 0)::numeric(12,2) AS subtotal,
        COALESCE(o.tax, 0)::numeric(12,2) AS tax,
        COALESCE(o.discount, 0)::numeric(12,2) AS discount,
        COALESCE(o.total, 0)::numeric(12,2) AS total,
        COALESCE(o.amount_paid, 0)::numeric(12,2) AS "amountPaid",
        COALESCE(o.balance_due, 0)::numeric(12,2) AS "balanceDue",
        o.payment_method AS "paymentMethod",
        o.channel,
        o.status,
        o.created_at AS "createdAt"
       FROM orders o
       WHERE o.id = $1`,
      [orderDbId]
    );

    const itemsRes = await pool.query(
      `SELECT product_id AS "productId", product_name AS "name", quantity, unit_price AS "price", subtotal 
       FROM order_items WHERE order_id = $1`,
      [orderDbId]
    );

    const allPaymentsRes = await pool.query(
      `SELECT id, amount::numeric(12,2) AS amount, payment_method AS "paymentMethod", notes, created_at AS "createdAt",
              TO_CHAR(created_at, 'DD Mon YYYY, HH24:MI') AS "formattedDate"
       FROM order_payments WHERE order_id = $1 ORDER BY created_at ASC`,
      [orderDbId]
    );

    const fullOrder = {
      ...updatedOrderRes.rows[0],
      subtotal: Number(updatedOrderRes.rows[0].subtotal),
      tax: Number(updatedOrderRes.rows[0].tax),
      discount: Number(updatedOrderRes.rows[0].discount),
      total: Number(updatedOrderRes.rows[0].total),
      amountPaid: Number(updatedOrderRes.rows[0].amountPaid),
      balanceDue: Number(updatedOrderRes.rows[0].balanceDue),
      items: itemsRes.rows.map((it) => ({
        productId: it.productId,
        name: it.name,
        quantity: Number(it.quantity),
        price: Number(it.price),
        subtotal: Number(it.subtotal)
      })),
      payments: allPaymentsRes.rows.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        notes: p.notes,
        createdAt: p.createdAt,
        formattedDate: p.formattedDate
      }))
    };

    res.json({
      message: 'Abono registrado exitosamente',
      payment: paymentRes.rows[0],
      order: fullOrder
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registering payment:', error);
    res.status(500).json({ error: 'Error al registrar el abono' });
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

// DELETE order (with automatic inventory restocking)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch order details
    const orderRes = await client.query(
      'SELECT id, order_number FROM orders WHERE order_number = $1 OR id::text = $1 FOR UPDATE',
      [id]
    );

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const order = orderRes.rows[0];
    const orderDbId = order.id;
    const orderNumber = order.order_number;

    // 2. Fetch order items to restock products
    const itemsRes = await client.query(
      'SELECT product_id, product_name, quantity, subtotal FROM order_items WHERE order_id = $1',
      [orderDbId]
    );

    for (const item of itemsRes.rows) {
      if (item.product_id) {
        // Return stock and revert sales counters
        await client.query(
          `UPDATE products 
           SET stock = stock + $1,
               units_sold = GREATEST(0, units_sold - $1),
               total_revenue = GREATEST(0, total_revenue - $2),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [Number(item.quantity), Number(item.subtotal), Number(item.product_id)]
        );

        // Record stock movement (restock)
        await client.query(
          `INSERT INTO stock_movements (product_id, type, quantity, reason)
           VALUES ($1, 'entrada', $2, $3)`,
          [Number(item.product_id), Number(item.quantity), `Restitución por eliminación de orden ${orderNumber}`]
        );
      }
    }

    // 3. Delete order (cascade deletes order_items and order_payments)
    await client.query('DELETE FROM orders WHERE id = $1', [orderDbId]);

    // 4. Log activity
    await client.query(
      `INSERT INTO activity_logs (type, title)
       VALUES ('sale', $1)`,
      [`Orden eliminada: ${orderNumber} (stock restituido)`]
    );

    await client.query('COMMIT');
    res.json({ message: 'Orden eliminada y stock restituido exitosamente', orderNumber });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Error al eliminar la orden' });
  } finally {
    client.release();
  }
});

export default router;
