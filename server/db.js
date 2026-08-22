import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/stockly_db',
});

// Test connection and auto-create tables
export const initDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Conectado exitosamente a PostgreSQL (stockly_db)');

    // 1. Settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
        name VARCHAR(150) NOT NULL DEFAULT 'Stockly Store',
        active_branch VARCHAR(100) NOT NULL DEFAULT 'Tienda Principal',
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        currency_symbol VARCHAR(5) NOT NULL DEFAULT '$',
        tax_rate NUMERIC(5,2) NOT NULL DEFAULT 16.00,
        address TEXT DEFAULT '',
        phone VARCHAR(50) DEFAULT '',
        admin_name VARCHAR(100) DEFAULT 'Alejandro',
        admin_email VARCHAR(150) DEFAULT 'alejandro@stockly.app'
      );
    `);

    // Insert default settings row if not exists
    await client.query(`
      INSERT INTO store_settings (id, name, active_branch, currency, currency_symbol, tax_rate, admin_name, admin_email)
      VALUES ('default', 'Mi Negocio', 'Tienda Principal', 'USD', '$', 16.00, 'Alejandro', 'alejandro@stockly.app')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 1.1. Categories
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        color VARCHAR(50) DEFAULT '#3b82f6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Suppliers
    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        contact_name VARCHAR(150),
        email VARCHAR(150),
        phone VARCHAR(50),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Customers
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150),
        phone VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3.1. Services (Servicios digitales / intangibles sin control de stock ni costos)
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(100) DEFAULT 'Servicios',
        default_price NUMERIC(12,2) DEFAULT 0.00,
        total_sales INT DEFAULT 0,
        total_revenue NUMERIC(12,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Products
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(100) NOT NULL,
        sku VARCHAR(100) UNIQUE,
        barcode VARCHAR(100),
        cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        sell_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        stock INT NOT NULL DEFAULT 0,
        min_stock INT NOT NULL DEFAULT 5,
        supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
        image_url TEXT,
        units_sold INT DEFAULT 0,
        total_revenue NUMERIC(12,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
        customer_name VARCHAR(150),
        customer_email VARCHAR(150),
        customer_phone VARCHAR(50),
        subtotal NUMERIC(12,2) NOT NULL,
        tax NUMERIC(12,2) NOT NULL,
        discount NUMERIC(12,2) DEFAULT 0.00,
        total NUMERIC(12,2) NOT NULL,
        amount_paid NUMERIC(12,2) DEFAULT 0.00,
        balance_due NUMERIC(12,2) DEFAULT 0.00,
        payment_method VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
        channel VARCHAR(50) NOT NULL DEFAULT 'Tienda física',
        status VARCHAR(50) NOT NULL DEFAULT 'Completado',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Auto-migration for existing orders table
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) DEFAULT 0.00;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_due NUMERIC(12,2) DEFAULT 0.00;
      UPDATE orders SET amount_paid = total, balance_due = 0.00 WHERE (amount_paid = 0.00 OR amount_paid IS NULL) AND status = 'Completado';
    `);

    // 5.1. Order Payments (Historial de Abonos a órdenes a crédito)
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_payments (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        amount NUMERIC(12,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Order Items
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id) ON DELETE SET NULL,
        service_id INT REFERENCES services(id) ON DELETE SET NULL,
        product_name VARCHAR(200) NOT NULL,
        quantity INT NOT NULL,
        unit_price NUMERIC(12,2) NOT NULL,
        subtotal NUMERIC(12,2) NOT NULL
      );

      ALTER TABLE order_items ADD COLUMN IF NOT EXISTS service_id INT REFERENCES services(id) ON DELETE SET NULL;
    `);

    // 7. Expenses
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        concept VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        payment_method VARCHAR(50) NOT NULL,
        supplier VARCHAR(150),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Stock Movements
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        quantity INT NOT NULL,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. Activity Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    client.release();
    console.log('✅ Tablas relacionales inicializadas en PostgreSQL');
  } catch (error) {
    console.error('❌ Error al inicializar PostgreSQL:', error);
  }
};
