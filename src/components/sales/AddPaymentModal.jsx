import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  DollarSign,
  Banknote,
  ArrowRightLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  User,
  Phone,
  HandCoins,
  History
} from 'lucide-react';

export const AddPaymentModal = ({ order, isOpen, onClose }) => {
  const { addOrderPayment, formatCurrency } = useApp();

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const total = Number(order.total || 0);
  const amountPaid = Number(order.amountPaid || order.amount_paid || 0);
  const balanceDue = Number(order.balanceDue !== undefined ? order.balanceDue : (order.balance_due !== undefined ? order.balance_due : Math.max(0, total - amountPaid)));
  const progressPct = total > 0 ? Math.min(100, Math.round((amountPaid / total) * 100)) : 100;
  const payments = order.payments || [];

  const handlePayRemaining = () => {
    setAmount(String(balanceDue.toFixed(2)));
  };

  const handleAddQuickAmount = (val) => {
    const nextVal = Math.min(balanceDue, val);
    setAmount(String(nextVal.toFixed(2)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Por favor ingresa un monto válido a abonar.');
      return;
    }
    if (numAmount > balanceDue) {
      alert(`El monto no puede superar el saldo pendiente (${formatCurrency(balanceDue)}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addOrderPayment(order.id, {
        amount: numAmount,
        paymentMethod,
        notes: notes.trim()
      });
      setAmount('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error adding payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-xs">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-tight">Registrar Abono a Cuenta</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {order.id}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Cliente: <strong className="text-white">{order.customer?.name || 'Cliente'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Balance & Progress Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                <span className="block text-[10px] font-bold text-slate-400">Total Venta</span>
                <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                  {formatCurrency(total)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 shadow-2xs">
                <span className="block text-[10px] font-bold text-emerald-700">Abonado</span>
                <span className="font-extrabold text-xs sm:text-sm text-emerald-700">
                  {formatCurrency(amountPaid)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 shadow-2xs">
                <span className="block text-[10px] font-bold text-rose-700">Resta por Pagar</span>
                <span className="font-extrabold text-xs sm:text-sm text-rose-700">
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                <span>Progreso de Liquidación</span>
                <span>{progressPct}% pagado</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Monto a Abonar Hoy ($)</span>
                <span className="text-rose-600 font-semibold text-[11px]">
                  Máximo: {formatCurrency(balanceDue)}
                </span>
              </label>

              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                  $
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={balanceDue}
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                  autoFocus
                />
              </div>

              {/* Quick Amount Suggestion Buttons */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {[5, 10, 20].map((val) => {
                  if (val > balanceDue) return null;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleAddQuickAmount(val)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-2xs"
                    >
                      +${val}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={handlePayRemaining}
                  className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-extrabold rounded-xl transition-colors ml-auto shadow-2xs flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Liquidar todo ({formatCurrency(balanceDue)})</span>
                </button>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Método de Cobro del Abono
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Efectivo')}
                  className={`py-2 px-3 rounded-2xl font-bold border flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'Efectivo'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs ring-1 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Transferencia')}
                  className={`py-2 px-3 rounded-2xl font-bold border flex items-center justify-center gap-2 transition-all ${
                    paymentMethod === 'Transferencia'
                      ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-xs ring-1 ring-purple-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                  <span>Transferencia</span>
                </button>
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nota o Detalle <span className="text-slate-400 font-normal text-[11px]">(Opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Abono semanal, Pago recibido en tienda..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !amount || Number(amount) <= 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                <HandCoins className="w-4 h-4" />
                <span>{isSubmitting ? 'Registrando...' : 'Confirmar y Aplicar Abono'}</span>
              </button>
            </div>
          </form>

          {/* Previous Payments History */}
          {payments.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Historial de Abonos Anteriores ({payments.length})</span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {payments.map((p, index) => (
                  <div
                    key={p.id || index}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center">
                        #{index + 1}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800">
                          {formatCurrency(p.amount)}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1.5">
                          via {p.paymentMethod || 'Efectivo'}
                        </span>
                        {p.notes && (
                          <p className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-[200px]">
                            {p.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 font-medium">
                      {p.formattedDate || p.createdAt ? new Date(p.createdAt).toLocaleDateString('es-ES') : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
