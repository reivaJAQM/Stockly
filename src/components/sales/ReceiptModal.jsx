import React from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { openWhatsAppReceipt, getWhatsAppReceiptUrl } from '../../utils/whatsapp';
import {
  X,
  Printer,
  CheckCircle,
  MessageCircle,
  ExternalLink,
  Phone
} from 'lucide-react';

export const ReceiptModal = ({ order, onClose }) => {
  const { data, formatCurrency } = useApp();

  if (!order) return null;

  const storeInfo = data.storeInfo || {};
  const storeName = storeInfo.name || 'Mi Negocio';
  const customerPhone = order.customer?.phone;
  const hasPhone = customerPhone && customerPhone !== 'N/A' && customerPhone.trim() !== '';

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    openWhatsAppReceipt(order, storeInfo);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[94vh] overflow-y-auto my-auto">
        
        {/* Header Badges */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
              <CheckCircle className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              Venta Registrada con Éxito
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WhatsApp Direct Action Banner */}
        <div className="mt-3.5 p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-950">Despacho por WhatsApp</p>
              <p className="text-[11px] text-emerald-700 font-medium">
                {hasPhone ? `Cliente: ${customerPhone}` : 'Envío directo en 1 clic'}
              </p>
            </div>
          </div>

          <button
            onClick={handleWhatsApp}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Enviar</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Printable Ticket Receipt */}
        <div id="printable-receipt" className="mt-3.5 p-5 bg-slate-50/90 rounded-2xl border border-slate-200 text-xs font-mono">
          {/* Business Header */}
          <div className="text-center space-y-1 pb-3.5 border-b border-dashed border-slate-300 flex flex-col items-center">
            <Logo size="sm" isDark={false} />
            <h2 className="font-extrabold text-base text-slate-900 tracking-tight font-sans mt-1">
              {storeName}
            </h2>
            {storeInfo.address && <p className="text-[10px] text-slate-500 font-sans">{storeInfo.address}</p>}
            {storeInfo.phone && <p className="text-[10px] text-slate-500 font-sans">Tel / WhatsApp: {storeInfo.phone}</p>}
          </div>

          {/* Order Meta */}
          <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Orden / Ticket:</span>
              <span className="font-bold text-slate-800">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Fecha y Hora:</span>
              <span className="text-slate-700">{order.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Cliente:</span>
              <span className="font-bold text-slate-900 font-sans">{order.customer?.name || "Cliente Mostrador"}</span>
            </div>
            {hasPhone && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">WhatsApp:</span>
                <span className="font-bold text-emerald-700 font-sans">{customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Método de Pago:</span>
              <span className="font-semibold text-slate-800 font-sans">{order.paymentMethod || "Efectivo"}</span>
            </div>
          </div>

          {/* Items Breakdown */}
          <div className="py-2.5 border-b border-dashed border-slate-300">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-200">
                  <th className="pb-1 font-semibold font-sans">Cant.</th>
                  <th className="pb-1 font-semibold font-sans">Descripción</th>
                  <th className="pb-1 text-right font-semibold font-sans">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(order.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 text-slate-600 font-sans font-semibold">{item.quantity}x</td>
                    <td className="py-1.5 text-slate-800 font-medium truncate max-w-[140px] font-sans">{item.name}</td>
                    <td className="py-1.5 text-right font-bold text-slate-900">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="py-2.5 space-y-1 text-[11px] font-sans">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal || order.total)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Descuento:</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-300 font-mono">
              <span>TOTAL PAGADO:</span>
              <span className="text-blue-600 text-base">{formatCurrency(order.total)}</span>
            </div>

            {order.paymentMethod === 'Efectivo' && Number(order.cashGiven) > 0 && (
              <div className="pt-2 mt-1 border-t border-dashed border-slate-200 space-y-0.5">
                <div className="flex justify-between text-slate-600">
                  <span>Efectivo recibido:</span>
                  <span className="font-semibold">{formatCurrency(order.cashGiven)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Cambio / Vuelto:</span>
                  <span>{formatCurrency(order.cashChange || 0)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer message */}
          <div className="text-center pt-3 border-t border-dashed border-slate-300 space-y-1">
            <p className="text-[10px] text-slate-500 font-sans font-medium">
              ¡Gracias por tu compra! Conserva este comprobante.
            </p>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="mt-5 flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
