import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AddPaymentModal } from '../sales/AddPaymentModal';
import {
  HandCoins,
  ArrowRight,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Calendar
} from 'lucide-react';

export const PendingDebtsWidget = () => {
  const { data, formatCurrency, setActiveTab } = useApp();
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);

  const orders = data.orders || [];

  // Find all pending credit orders with balance due > 0
  const pendingOrders = orders.filter((o) => {
    if (o.status === 'Cancelado') return false;
    const balance = Number(o.balanceDue !== undefined ? o.balanceDue : (o.balance_due || 0));
    return balance > 0;
  });

  const totalPendingDebt = pendingOrders.reduce((sum, o) => {
    const balance = Number(o.balanceDue !== undefined ? o.balanceDue : (o.balance_due || 0));
    return sum + balance;
  }, 0);

  // Group pending debt by customer
  const customerDebts = [];
  const processedCustomers = new Set();

  pendingOrders.forEach((order) => {
    const custKey = order.customer?.id || order.customer?.name || 'Cliente';
    if (!processedCustomers.has(custKey)) {
      processedCustomers.add(custKey);
      const custOrders = pendingOrders.filter((o) => (o.customer?.id || o.customer?.name) === custKey);
      const custTotalDebt = custOrders.reduce((sum, o) => {
        return sum + Number(o.balanceDue !== undefined ? o.balanceDue : (o.balance_due || 0));
      }, 0);

      customerDebts.push({
        key: custKey,
        customer: order.customer || { name: 'Cliente' },
        totalDebt: custTotalDebt,
        ordersCount: custOrders.length,
        latestOrder: custOrders[0] // to open payment modal directly
      });
    }
  });

  // Sort by highest debt first
  customerDebts.sort((a, b) => b.totalDebt - a.totalDebt);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shadow-2xs flex-shrink-0">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Cuentas por Cobrar
                </h4>
                {customerDebts.length > 0 && (
                  <span className="text-[11px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {customerDebts.length} {customerDebts.length === 1 ? 'cliente con deuda' : 'clientes con deuda'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Saldos pendientes de cobro a clientes
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('customers')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs border border-slate-200/70 transition-colors self-start sm:self-auto"
          >
            <span>Ver Clientes</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Content list or Empty State */}
        {customerDebts.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3 text-emerald-600 shadow-2xs">
              <CheckCircle2 className="w-6 h-6 stroke-[2]" />
            </div>
            <p className="font-bold text-sm text-slate-800 mb-1">
              ¡Todas las cuentas al día!
            </p>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              No tienes clientes con deudas pendientes. Las ventas a crédito aparecerán aquí automáticamente para facilitar el cobro de abonos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {customerDebts.map((item) => (
              <div
                key={item.key}
                className="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50/90 border border-slate-100 hover:border-slate-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 group"
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100/80 border border-amber-200/70 text-amber-900 font-black text-sm flex items-center justify-center flex-shrink-0 shadow-2xs">
                    {(item.customer?.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-extrabold text-slate-900 text-sm truncate leading-snug" title={item.customer?.name}>
                      {item.customer?.name || 'Cliente'}
                    </h5>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1 flex-wrap">
                      {item.customer?.phone && item.customer?.phone !== 'N/A' && (
                        <span className="flex items-center gap-1 text-slate-500 font-semibold">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{item.customer.phone}</span>
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200/70 text-slate-500">
                        {item.ordersCount} {item.ordersCount === 1 ? 'cuenta pendiente' : 'cuentas pendientes'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Debt amount & Action Button */}
                <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      Saldo Deudor
                    </span>
                    <span className="font-extrabold text-rose-600 text-base sm:text-lg tracking-tight">
                      {formatCurrency(item.totalDebt)}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedOrderForPayment(item.latestOrder)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Registrar abono para este cliente"
                  >
                    <HandCoins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Abonar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Total */}
      {customerDebts.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-xs text-slate-500 font-semibold">
            Total pendiente por cobrar en el negocio:
          </span>
          <span className="font-extrabold text-rose-600 text-base">
            {formatCurrency(totalPendingDebt)}
          </span>
        </div>
      )}

      {/* Modal para Abonar directamente desde el Dashboard */}
      {selectedOrderForPayment && (
        <AddPaymentModal
          order={selectedOrderForPayment}
          isOpen={Boolean(selectedOrderForPayment)}
          onClose={() => setSelectedOrderForPayment(null)}
        />
      )}
    </div>
  );
};
