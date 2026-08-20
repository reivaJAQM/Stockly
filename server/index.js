import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db.js';

import productsRouter from './routes/products.js';
import salesRouter from './routes/sales.js';
import expensesRouter from './routes/expenses.js';
import customersRouter from './routes/customers.js';
import suppliersRouter from './routes/suppliers.js';
import settingsRouter from './routes/settings.js';
import dashboardRouter from './routes/dashboard.js';
import categoriesRouter from './routes/categories.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/categories', categoriesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'PostgreSQL', service: 'Stockly API' });
});

const startServer = async () => {
  try {
    await initDB();
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor backend de Stockly corriendo en http://localhost:${PORT}`);
    });
    
    // Prevent process from exiting while server is running
    setInterval(() => {}, 1000 * 60 * 60);
  } catch (err) {
    console.error('Error al iniciar el servidor:', err);
  }
};

startServer();
