import express from 'express';
import sharp from 'sharp';
import { pool } from '../db.js';

const router = express.Router();

// Helper to guarantee WebP 200x200 thumbnail optimization
async function optimizeImageToWebP(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('data:image/')) {
    return imageUrl || '';
  }
  try {
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
    const inputBuffer = Buffer.from(base64Data, 'base64');
    const webpBuffer = await sharp(inputBuffer)
      .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 80 })
      .toBuffer();
    return `data:image/webp;base64,${webpBuffer.toString('base64')}`;
  } catch (err) {
    console.error('Error optimizing image with sharp:', err.message);
    return imageUrl;
  }
}

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
    res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=45');
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
    const optimizedImage = await optimizeImageToWebP(image);

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
        optimizedImage
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

// POST batch restock / entrada de mercancía
router.post('/batch-restock', async (req, res) => {
  const { items, reason, supplier, registerExpense, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No se enviaron productos para reabastecer' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updatedProducts = [];
    let totalExpenseAmount = 0;

    for (const item of items) {
      const prodId = item.productId;
      const qty = parseInt(item.quantity, 10);
      const cost = item.costPrice !== undefined && item.costPrice !== null ? Number(item.costPrice) : null;

      if (!prodId || isNaN(qty) || qty <= 0) continue;

      const prodRes = await client.query('SELECT id, name, stock, cost_price FROM products WHERE id = $1 FOR UPDATE', [prodId]);
      if (prodRes.rows.length === 0) continue;

      const currentProd = prodRes.rows[0];
      const newStock = Number(currentProd.stock) + qty;
      const newCost = (cost !== null && !isNaN(cost) && cost >= 0) ? cost : Number(currentProd.cost_price || 0);

      // Update product stock and optionally cost price
      const updateRes = await client.query(
        `UPDATE products 
         SET stock = $1, cost_price = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3 
         RETURNING id, name, stock, cost_price AS "costPrice"`,
        [newStock, newCost, prodId]
      );
      updatedProducts.push(updateRes.rows[0]);

      // Record stock movement
      await client.query(
        `INSERT INTO stock_movements (product_id, type, quantity, reason) 
         VALUES ($1, $2, $3, $4)`,
        [prodId, 'entrada', qty, reason || 'Reabastecimiento de mercancía']
      );

      // Record activity log
      await client.query(
        `INSERT INTO activity_logs (type, title) 
         VALUES ($1, $2)`,
        ['inventory', `Entrada de mercancía (+${qty} un.): ${currentProd.name} (${reason || 'Reposición'})`]
      );

      totalExpenseAmount += qty * newCost;
    }

    // Optional: register expense in expenses table
    if (registerExpense && totalExpenseAmount > 0) {
      await client.query(
        `INSERT INTO expenses (concept, category, amount, payment_method, supplier, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          `Compra de mercancía (${updatedProducts.length} prod.)`,
          'Inventario / Mercancía',
          totalExpenseAmount,
          paymentMethod || 'Efectivo',
          supplier || 'Proveedor',
          reason || 'Entrada masiva de stock'
        ]
      );
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      updatedCount: updatedProducts.length,
      totalCost: totalExpenseAmount,
      products: updatedProducts
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in batch restock:', error);
    res.status(500).json({ error: 'Error al procesar entrada de mercancía' });
  } finally {
    client.release();
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
    const optimizedImage = await optimizeImageToWebP(image);

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
        optimizedImage,
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
