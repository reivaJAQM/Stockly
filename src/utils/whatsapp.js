/**
 * Utilidades para despacho directo e instantáneo de comprobantes por WhatsApp
 * Formato universal 100% compatible con WhatsApp Web, Desktop y Móvil (sin caracteres rotos)
 */

export const formatEcuadorPhone = (phone) => {
  if (!phone) return '';
  let clean = phone.toString().replace(/\D/g, '');
  if (clean.length === 10 && clean.startsWith('0')) {
    return '593' + clean.slice(1);
  }
  if (clean.length === 9 && clean.startsWith('9')) {
    return '593' + clean;
  }
  return clean;
};

export const buildReceiptMessage = (order, storeInfo = {}) => {
  const storeName = storeInfo?.name || 'Mi Negocio';
  const storePhone = storeInfo?.phone || '';
  const customerName = order.customer?.name || 'Cliente Mostrador';
  const orderNumber = order.id || '#ORD-000';
  const orderDate = order.date || new Date().toLocaleString('es-EC');
  const paymentMethod = order.paymentMethod || 'Efectivo';
  const total = Number(order.total || 0).toFixed(2);
  const subtotal = Number(order.subtotal || order.total || 0).toFixed(2);
  const discount = Number(order.discount || 0);

  const itemsList = (order.items || [])
    .map(item => `* ${item.quantity}x ${item.name} -> $${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}`)
    .join('\n');

  const sep = '----------------------------------------';

  let lines = [
    `*COMPROBANTE DE COMPRA*`,
    `*${storeName}*`
  ];

  if (storePhone) {
    lines.push(`Tel / WhatsApp: ${storePhone}`);
  }

  lines.push(sep);
  lines.push(`*Orden:* ${orderNumber}`);
  lines.push(`*Fecha:* ${orderDate}`);
  lines.push(`*Cliente:* ${customerName}`);
  lines.push(`*Metodo de Pago:* ${paymentMethod}`);
  lines.push(sep);
  lines.push(`*DETALLE DE PRODUCTOS:*`);
  lines.push(itemsList || '* 1x Consumo general');
  lines.push(sep);

  if (discount > 0) {
    lines.push(`Subtotal: $${subtotal}`);
    lines.push(`Descuento: -$${discount.toFixed(2)}`);
  }

  lines.push(`*TOTAL PAGADO:* *$${total}*`);

  if (paymentMethod === 'Efectivo' && Number(order.cashGiven) > 0) {
    lines.push(`Efectivo recibido: $${Number(order.cashGiven).toFixed(2)}`);
    lines.push(`Cambio / Vuelto: $${Number(order.cashChange || 0).toFixed(2)}`);
  }

  lines.push(sep);
  lines.push(`¡Muchas gracias por su compra!`);
  lines.push(`_Conserve este mensaje como su comprobante digital._`);

  return lines.join('\n');
};

export const getWhatsAppReceiptUrl = (order, storeInfo = {}) => {
  const phone = formatEcuadorPhone(order.customer?.phone);
  const message = buildReceiptMessage(order, storeInfo);
  const encodedText = encodeURIComponent(message);
  
  if (phone) {
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
};

export const openWhatsAppReceipt = (order, storeInfo = {}) => {
  const url = getWhatsAppReceiptUrl(order, storeInfo);
  window.open(url, '_blank', 'noopener,noreferrer');
};
