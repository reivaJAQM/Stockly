import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET store settings
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM store_settings WHERE id = $1', ['default']);
    if (result.rows.length === 0) {
      return res.json({
        name: 'Mi Negocio',
        activeBranch: 'Tienda Principal',
        branches: ['Tienda Principal'],
        currency: 'USD',
        currencySymbol: '$',
        taxRate: 16,
        address: '',
        phone: '',
        user: { name: 'Alejandro', role: 'Administrador', email: 'alejandro@stockly.app', avatar: null }
      });
    }

    const row = result.rows[0];
    res.json({
      name: row.name,
      activeBranch: row.active_branch,
      branches: [row.active_branch, 'Sucursal Norte', 'Bodega Central'],
      currency: row.currency,
      currencySymbol: row.currency_symbol,
      taxRate: Number(row.tax_rate),
      address: row.address || '',
      phone: row.phone || '',
      user: {
        name: row.admin_name || 'Alejandro',
        role: 'Administrador',
        email: row.admin_email || 'alejandro@stockly.app',
        avatar: null
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// PUT update store settings
router.put('/', async (req, res) => {
  const { name, activeBranch, currency, currencySymbol, taxRate, address, phone, user } = req.body;

  try {
    await pool.query(
      `UPDATE store_settings 
       SET name = $1, active_branch = $2, currency = $3, currency_symbol = $4,
           tax_rate = $5, address = $6, phone = $7, admin_name = $8, admin_email = $9
       WHERE id = 'default'`,
      [
        name,
        activeBranch || 'Tienda Principal',
        currency || 'USD',
        currencySymbol || '$',
        Number(taxRate || 16),
        address || '',
        phone || '',
        user?.name || 'Alejandro',
        user?.email || 'alejandro@stockly.app'
      ]
    );

    res.json({ message: 'Configuración actualizada exitosamente' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

export default router;
