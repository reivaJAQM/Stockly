import express from 'express';
import { whatsappService } from '../services/whatsapp.js';

const router = express.Router();

// GET current WhatsApp connection status and QR code
router.get('/status', (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST start WhatsApp initialization to generate QR
router.post('/init', async (req, res) => {
  try {
    whatsappService.initialize(); // Async non-blocking
    res.json({ message: 'Iniciando conexión de WhatsApp...', status: whatsappService.getStatus() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST send WhatsApp message in background
router.post('/send', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'Teléfono y mensaje son requeridos.' });
  }

  try {
    const result = await whatsappService.sendMessage(phone, message);
    res.json({ success: true, message: 'Ticket enviado exitosamente a WhatsApp.', ...result });
  } catch (error) {
    console.error('Error en /api/whatsapp/send:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// POST logout / disconnect WhatsApp
router.post('/logout', async (req, res) => {
  try {
    await whatsappService.logout();
    res.json({ success: true, message: 'WhatsApp desconectado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
