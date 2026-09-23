import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  User,
  Phone,
  Receipt,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  HandCoins,
  Banknote,
  ArrowRightLeft,
  CreditCard,
  Package,
  Layers,
  ChevronRight,
  Sparkles,
  Check,
  ChevronDown
} from 'lucide-react';

export const CustomerDebtsModal = ({ customerDebtData, isOpen, onClose }) => {
  const {
    formatCurrency,
    settleMultipleCustomerOrders,
    applyGlobalPayment,
    addOrderPayment
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'liquidate' | 'global_payment'
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [globalAmount, setGlobalAmount] = useState('');
  const [singlePaymentOrder, setSinglePaymentOrder] = useState(null);
  const [singleAmount, setSingleAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !customerDebtData) return null;

  const { customer, orders = [] } = customerDebtData;

  // Filtrar solo las que tengan saldo deudor > 0
  const activeOrders = orders.filter((o) => {
    if (o.status === 'Cancelado') return false;
    const balance = Number(o.balanceDue !== undefined ? o.balanceDue : (o.balance_due || 0));
    return balance > 0;
  });

  const totalDebt = activeOrders.reduce((sum, o) => {
    const balance = Number(o.balanceDue !== undefined ? o.balanceDue : (o.balance_due || 0));
    return sum + balance;
  }, 0);

  // Si todas fueron liquidadas mientras el modal estaba abierto
  if (activeOrders.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-md rounded-3xl p-6 text-center shadow-2xl border border-slate-100 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900">¡Cuentas al Día!</h3>
          <p className="text-xs text-slate-500">
            {customer?.name || 'El cliente'} no tiene cuentas pendientes por pagar en este momento.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  // 1. Manejador para Liquidar Todas las Deudas
  const handleSettleAll = async () => {
    if (!window.confirm(`¿Confirmas liquidar todas las cuentas de ${customer?.name || 'este cliente'} por un total de ${formatCurrency(totalDebt)}?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await settleMultipleCustomerOrders(activeOrders, paymentMethod, `Liquidación completa de todas las deudas (${paymentMethod})`);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Manejador para Abono Global
  const handleApplyGlobal = async (e) => {
    e.preventDefault();
    const num = Number(globalAmount);
    if (!num || num <= 0) {
      alert('Ingresa un monto válido para el abono global.');
      return;
    }
    if (num > totalDebt) {
      alert(`El abono no puede superar la deuda total (${formatCurrency(totalDebt)}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await applyGlobalPayment(activeOrders, num, paymentMethod);
      setGlobalAmount('');
      setActiveTab('overview');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Manejador para Abono Individual a una Venta Específica
  const handleApplySingle = async (e, order) => {
    e.preventDefault();
    const num = Number(singleAmount);
    const balance = Number(order.balanceDue !== undefined ? order.balanceDue : (order.balance_due || 0));

    if (!num || num <= 0) {
      alert('Ingresa un monto válido.');
      return;
    }
    if (num > balance) {
      alert(`El monto no puede superar el saldo de esta venta (${formatCurrency(balance)}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await addOrderPayment(order.id, {
        amount: num,
        paymentMethod,
        notes: `Abono a orden ${order.orderNumber || order.order_number || order.id}`
      });
      setSinglePaymentOrder(null);
      setSingleAmount('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Manejador para saldar una orden específica de golpe
  const handleSettleSingle = async (order) => {
    const balance = Number(order.balanceDue !== undefined ? order.balanceDue : (order.balance_due || 0));
    if (!window.confirm(`¿Liquidar totalmente esta compra (${order.orderNumber || order.order_number || order.id}) por ${formatCurrency(balance)}?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addOrderPayment(order.id, {
        amount: balance,
        paymentMethod,
        notes: `Liquidación total de orden ${order.orderNumber || order.order_number || order.id}`
      });
      setSinglePaymentOrder(null);
      setSingleAmount('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cálculo de distribución previa para Abono Global
  const numGlobal = Number(globalAmount) || 0;
  let remainingPreview = numGlobal;
  const distributionPreview = activeOrders.map((order) => {
    const balance = Number(order.balanceDue !== undefined ? order.balanceDue : (order.balance_due || 0));
    const payForThis = Math.min(remainingPreview, balance);
    remainingPreview = Math.max(0, remainingPreview - payForThis);
    return {
      orderId: order.id,
      orderNumber: order.orderNumber || order.order_number || order.id,
      balance,
      paying: payForThis,
      newBalance: balance - payForThis
    };
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between relative">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-400 flex items-center justify-center font-black text-lg flex-shrink-0 shadow-xs">
              {(customer?.name || 'C').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-base sm:text-lg tracking-tight truncate leading-snug">
                {customer?.name || 'Cliente'}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-300 font-medium mt-1 flex-wrap">
                {customer?.phone && customer?.phone !== 'N/A' && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.phone}</span>
                  </span>
                )}
                {/* Indicador estilizado (NO parece botón) */}
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                  <Receipt className="w-3.5 h-3.5 text-amber-400/80" />
                  <span>
                    {activeOrders.length} {activeOrders.length === 1 ? 'cuenta pendiente' : 'cuentas pendientes'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 ml-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Deuda Total
              </span>
              <span className="font-extrabold text-rose-400 text-lg tracking-tight">
                {formatCurrency(totalDebt)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Summary & Mode Selector */}
        <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="sm:hidden flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500">Deuda Total Acumulada:</span>
              <span className="font-extrabold text-rose-600 text-base">{formatCurrency(totalDebt)}</span>
            </div>

            {/* Selector de Modo: Resumen / Liquidar Todo / Abono Global */}
            <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-2xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  setSinglePaymentOrder(null);
                }}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Cuentas ({activeOrders.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('liquidate');
                  setSinglePaymentOrder(null);
                }}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'liquidate'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Liquidar Todo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('global_payment');
                  setSinglePaymentOrder(null);
                }}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'global_payment'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                <HandCoins className="w-3.5 h-3.5" />
                <span>Abono Global</span>
              </button>
            </div>

            {/* Selector de Método de Pago Global */}
            {(activeTab === 'liquidate' || activeTab === 'global_payment') && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs self-start sm:self-auto">
                {['Efectivo', 'Transferencia'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      paymentMethod === m
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Panel para Liquidar Todo */}
          {activeTab === 'liquidate' && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
              <div>
                <h5 className="font-extrabold text-sm text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Liquidar la deuda completa ({formatCurrency(totalDebt)})</span>
                </h5>
                <p className="text-xs text-emerald-800/80 mt-0.5">
                  Se saldarán las {activeOrders.length} compras pendientes del cliente dejándolo con saldo en $0.00.
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSettleAll}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
              >
                <span>{isSubmitting ? 'Procesando...' : `Confirmar Liquidación (${formatCurrency(totalDebt)})`}</span>
              </button>
            </div>
          )}

          {/* Panel para Abono Global */}
          {activeTab === 'global_payment' && (
            <form onSubmit={handleApplyGlobal} className="mt-4 p-4 rounded-2xl bg-blue-50 border border-blue-200/80 space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-blue-950 mb-1">
                    Monto del Abono Global ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={totalDebt}
                      required
                      placeholder="0.00"
                      value={globalAmount}
                      onChange={(e) => setGlobalAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center pt-2 sm:pt-4">
                  {[10, 20, 50].map((val) => {
                    if (val > totalDebt) return null;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setGlobalAmount(String(val))}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-100/70 border border-blue-200 text-blue-900 font-extrabold text-xs shadow-2xs transition-colors cursor-pointer"
                      >
                        ${val}
                      </button>
                    );
                  })}
                  <button
                    type="submit"
                    disabled={isSubmitting || !numGlobal}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex-shrink-0"
                  >
                    {isSubmitting ? 'Procesando...' : 'Aplicar Abono'}
                  </button>
                </div>
              </div>

              {/* Vista previa de cómo se distribuirá el abono */}
              {numGlobal > 0 && (
                <div className="p-3 bg-white/90 rounded-xl border border-blue-100 text-xs space-y-1.5">
                  <span className="font-bold text-slate-700 block text-[11px]">
                    Distribución del abono (de la compra más antigua a la más reciente):
                  </span>
                  <div className="space-y-1">
                    {distributionPreview.map((d) => (
                      <div key={d.orderId} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-medium">
                          {d.orderNumber}: Deuda actual {formatCurrency(d.balance)}
                        </span>
                        <span className={`font-bold ${d.paying > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {d.paying > 0 ? `+ Abona ${formatCurrency(d.paying)} → Resta ${formatCurrency(d.newBalance)}` : 'Sin cambio'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Modal Body: List of Independent Orders */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Compras a Crédito Pendientes ({activeOrders.length})
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">
              Puedes abonar a una compra específica o saldarla
            </span>
          </div>

          <div className="space-y-3.5">
            {activeOrders.map((order, idx) => {
              const orderNum = order.orderNumber || order.order_number || order.id;
              const total = Number(order.total || 0);
              const amountPaid = Number(order.amountPaid || order.amount_paid || 0);
              const balance = Number(order.balanceDue !== undefined ? order.balanceDue : (order.balance_due || Math.max(0, total - amountPaid)));
              const progressPct = total > 0 ? Math.min(100, Math.round((amountPaid / total) * 100)) : 0;
              const dateStr = order.createdAt || order.created_at || '';
              const items = order.items || [];
              const isSelectedForSingle = singlePaymentOrder?.id === order.id;

              return (
                <div
                  key={order.id || idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSelectedForSingle
                      ? 'border-blue-500 bg-blue-50/20 shadow-md ring-1 ring-blue-500/20'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Top Bar of Order */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs">
                        {orderNum}
                      </span>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <span>{dateStr ? new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Fecha no registrada'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                        Pendiente
                      </span>
                    </div>
                  </div>

                  {/* Items Purchased in this Order */}
                  <div className="py-2.5">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">
                      Productos Comprados:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {items.length > 0 ? (
                        items.map((it, iIdx) => (
                          <span
                            key={iIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px] font-medium text-slate-700"
                          >
                            <span className="font-bold text-slate-900">{it.quantity}×</span>
                            <span>{it.name}</span>
                            <span className="text-slate-400">({formatCurrency(it.price * it.quantity)})</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Venta rápida registrada</span>
                      )}
                    </div>
                  </div>

                  {/* Amounts & Progress Grid */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-slate-50/70 border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Total Compra</span>
                      <span className="font-extrabold text-xs text-slate-800">{formatCurrency(total)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 block">Ya Abonado</span>
                      <span className="font-extrabold text-xs text-emerald-700">{formatCurrency(amountPaid)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-rose-700 block">Saldo Restante</span>
                      <span className="font-extrabold text-xs sm:text-sm text-rose-700">{formatCurrency(balance)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Actions for this specific order */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isSelectedForSingle) {
                            setSinglePaymentOrder(null);
                            setSingleAmount('');
                          } else {
                            setSinglePaymentOrder(order);
                            setSingleAmount('');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelectedForSingle
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs'
                        }`}
                      >
                        <HandCoins className="w-3.5 h-3.5" />
                        <span>{isSelectedForSingle ? 'Cancelar Abono' : 'Abonar a esta compra'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleSettleSingle(order)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Saldar ({formatCurrency(balance)})</span>
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium">
                      {progressPct}% pagado
                    </span>
                  </div>

                  {/* Inline Form to pay to this specific order */}
                  {isSelectedForSingle && (
                    <form
                      onSubmit={(e) => handleApplySingle(e, order)}
                      className="mt-3 p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2.5 animate-in fade-in duration-150"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex-1">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Monto a abonar a la compra {orderNum}:
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              max={balance}
                              required
                              placeholder="0.00"
                              value={singleAmount}
                              onChange={(e) => setSingleAmount(e.target.value)}
                              className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center pt-2 sm:pt-4">
                          <button
                            type="button"
                            onClick={() => setSingleAmount(String(balance.toFixed(2)))}
                            className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[11px] shadow-2xs hover:bg-slate-50 cursor-pointer"
                          >
                            Todo ({formatCurrency(balance)})
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting || !Number(singleAmount)}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            {isSubmitting ? 'Guardando...' : 'Confirmar Abono'}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Mostrando <strong className="text-slate-900">{activeOrders.length}</strong> compras con crédito pendiente
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
