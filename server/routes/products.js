import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET all products
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.sku,
        p.barcode,
        p.cost_price AS "costPrice",
        p.sell_price AS "sellPrice",
        p.stock,
        p.min_stock AS "minStock",
        p.supplier_id AS "supplierId",
        p.image_url AS "image",
        p.units_sold AS "unitsSold",
        p.total_revenue AS "totalRevenue",
        p.created_at AS "createdAt"
      FROM products p
      ORDER BY p.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// POST create product
router.post('/', async (req, res) => {
  const {
    name,
    category,
    sku,
    barcode,
    costPrice,
    sellPrice,
    stock,
    minStock,
    supplierId,
    image
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO products (name, category, sku, barcode, cost_price, sell_price, stock, min_stock, supplier_id, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING 
        id, name, category, sku, barcode,
        cost_price AS "costPrice",
        sell_price AS "sellPrice",
        stock, min_stock AS "minStock",
        supplier_id AS "supplierId",
        image_url AS "image",
        units_sold AS "unitsSold",
        total_revenue AS "totalRevenue"`,
      [
        name,
        category || 'General',
        sku ? sku.trim() : null,
        barcode ? barcode.trim() : null,
        Number(costPrice || 0),
        Number(sellPrice || 0),
        Number(stock || 0),
        Number(minStock || 5),
        supplierId ? Number(supplierId) : null,
        image || ''
      ]
    );

    const newProduct = result.rows[0];

    // Log activity
    await pool.query(
      `INSERT INTO activity_logs (type, title) VALUES ($1, $2)`,
      ['product', `Nuevo producto agregado: ${newProduct.name}`]
    );

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PUT update product
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    category,
    sku,
    barcode,
    costPrice,
    sellPrice,
    stock,
    minStock,
    supplierId,
    image
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products
       SET name = $1, category = $2, sku = $3, barcode = $4, cost_price = $5, sell_price = $6,
           stock = $7, min_stock = $8, supplier_id = $9, image_url = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING 
        id, name, category, sku, barcode,
        cost_price AS "costPrice",
        sell_price AS "sellPrice",
        stock, min_stock AS "minStock",
        supplier_id AS "supplierId",
        image_url AS "image",
        units_sold AS "unitsSold",
        total_revenue AS "totalRevenue"`,
      [
        name,
        category,
        sku,
        barcode,
        Number(costPrice || 0),
        Number(sellPrice || 0),
        Number(stock || 0),
        Number(minStock || 5),
        supplierId ? Number(supplierId) : null,
        image || '',
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const updated = result.rows[0];

    await pool.query(
      `INSERT INTO activity_logs (type, title) VALUES ($1, $2)`,
      ['product', `Producto actualizado: ${updated.name}`]
    );

    res.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado', name: result.rows[0].name });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// POST adjust stock
router.post('/:id/adjust-stock', async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body; // amount can be positive or negative

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const prodRes = await client.query('SELECT name, stock FROM products WHERE id = $1 FOR UPDATE', [id]);
      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      const product = prodRes.rows[0];
      const newStock = Math.max(0, Number(product.stock) + Number(amount));

      const updateRes = await client.query(
        `UPDATE products 
         SET stock = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING id, name, stock`,
        [newStock, id]
      );

      // Record movement
      await client.query(
        `INSERT INTO stock_movements (product_id, type, quantity, reason) 
         VALUES ($1, $2, $3, $4)`,
        [id, amount >= 0 ? 'entrada' : 'salida', Math.abs(amount), reason || 'Ajuste manual']
      );

      // Record activity
      await client.query(
        `INSERT INTO activity_logs (type, title) 
         VALUES ($1, $2)`,
        ['inventory', `Stock ${amount > 0 ? 'aumentado (+' + amount + ')' : 'reducido (' + amount + ')'}: ${product.name} (${reason || 'Ajuste'})`]
      );

      await client.query('COMMIT');
      res.json(updateRes.rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: 'Error al ajustar existencias' });
  }
});

export default router;
