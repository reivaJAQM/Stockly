import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';

class WhatsAppService {
  constructor() {
    this.client = null;
    this.qrCodeDataUrl = null;
    this.status = 'DISCONNECTED'; // DISCONNECTED | SCAN_QR | CONNECTING | CONNECTED
    this.connectedInfo = null;
    this.lastError = null;
    this.isInitializing = false;
  }

  async initialize() {
    if (this.isInitializing || this.status === 'CONNECTED') {
      return;
    }

    this.isInitializing = true;
    this.status = 'CONNECTING';
    this.lastError = null;
    console.log('🤖 Iniciando servicio de WhatsApp Web...');

    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: './.wwebjs_auth'
        }),
        puppeteer: {
          headless: true,
          executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ]
        }
      });

      this.client.on('qr', async (qr) => {
        try {
          console.log('📷 Nuevo código QR generado para WhatsApp');
          this.qrCodeDataUrl = await qrcode.toDataURL(qr, {
            margin: 2,
            width: 300,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          });
          this.status = 'SCAN_QR';
        } catch (err) {
          console.error('Error generando QR de WhatsApp:', err);
        }
      });

      this.client.on('ready', () => {
        this.status = 'CONNECTED';
        this.qrCodeDataUrl = null;
        this.isInitializing = false;
        const info = this.client.info || {};
        this.connectedInfo = {
          name: info.pushname || 'WhatsApp Negocio',
          phone: info.wid?.user || ''
        };
        console.log(`✅ WhatsApp conectado exitosamente (${this.connectedInfo.phone || 'Listo'})`);
      });

      this.client.on('authenticated', () => {
        console.log('🔐 WhatsApp autenticado');
      });

      this.client.on('auth_failure', (msg) => {
        console.error('❌ Error de autenticación en WhatsApp:', msg);
        this.status = 'DISCONNECTED';
        this.qrCodeDataUrl = null;
        this.isInitializing = false;
        this.lastError = msg;
      });

      this.client.on('disconnected', (reason) => {
        console.log('⚠️ WhatsApp desconectado:', reason);
        this.status = 'DISCONNECTED';
        this.qrCodeDataUrl = null;
        this.connectedInfo = null;
        this.isInitializing = false;
      });

      await this.client.initialize();
    } catch (error) {
      console.error('Error al inicializar cliente de WhatsApp:', error);
      this.status = 'DISCONNECTED';
      this.isInitializing = false;
      this.lastError = error.message;
    }
  }

  getStatus() {
    return {
      status: this.status,
      qrCode: this.qrCodeDataUrl,
      connectedInfo: this.connectedInfo,
      lastError: this.lastError
    };
  }

  formatEcuadorPhone(phone) {
    if (!phone) return null;
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0') && clean.length === 10) {
      clean = '593' + clean.substring(1);
    } else if (clean.length === 9 && clean.startsWith('9')) {
      clean = '593' + clean;
    } else if (!clean.startsWith('593') && clean.length <= 10) {
      clean = '593' + clean;
    }
    return clean;
  }

  async sendMessage(phone, message) {
    if (this.status !== 'CONNECTED' || !this.client) {
      throw new Error('El servicio de WhatsApp no está conectado. Escanea el código QR en Configuración.');
    }

    const cleanPhone = this.formatEcuadorPhone(phone);
    if (!cleanPhone) {
      throw new Error('Número de teléfono inválido');
    }

    const chatId = `${cleanPhone}@c.us`;

    try {
      const response = await this.client.sendMessage(chatId, message);
      console.log(`✅ Mensaje enviado exitosamente por WhatsApp a +${cleanPhone}`);
      const msgId = response && response.id ? (response.id._serialized || response.id.id || 'sent') : 'sent';
      return { success: true, messageId: msgId };
    } catch (error) {
      console.error(`Error enviando mensaje a +${cleanPhone}:`, error.message);
      throw error;
    }
  }

  async logout() {
    try {
      if (this.client) {
        await this.client.logout();
        await this.client.destroy();
      }
      this.client = null;
      this.status = 'DISCONNECTED';
      this.qrCodeDataUrl = null;
      this.connectedInfo = null;
      this.isInitializing = false;
      return { success: true };
    } catch (error) {
      console.error('Error al desconectar WhatsApp:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();
