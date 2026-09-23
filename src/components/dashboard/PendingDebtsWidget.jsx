import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerDebtsModal } from './CustomerDebtsModal';
import {
  HandCoins,
  User,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Calendar,
  ChevronRight
} from 'lucide-react';

export const PendingDebtsWidget = () => {
  const { data, formatCurrency } = useApp();
  const [selectedCustomerForDebts, setSelectedCustomerForDebts] = useState(null);

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
        orders: custOrders
      });
    }
  });

  // Sort by highest debt first
  customerDebts.sort((a, b) => b.totalDebt - a.totalDebt);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shadow-2xs flex-shrink-0">
            <HandCoins className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
              Cuentas por Cobrar
            </h4>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {customerDebts.length > 0
                ? `${customerDebts.length} ${customerDebts.length === 1 ? 'cliente con deuda pendiente' : 'clientes con deuda pendiente'}`
                : 'Sin deudas pendientes'}
            </p>
          </div>
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
                onClick={() => setSelectedCustomerForDebts(item)}
                className="p-4 rounded-2xl bg-slate-50/70 hover:bg-blue-50/40 border border-slate-100 hover:border-blue-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 group cursor-pointer"
                title="Haz clic para ver las deudas detalladas de este cliente"
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100/80 border border-amber-200/70 text-amber-900 font-black text-sm flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-102 transition-transform">
                    {(item.customer?.name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-extrabold text-slate-900 text-sm truncate leading-snug group-hover:text-blue-600 transition-colors" title={item.customer?.name}>
                      {item.customer?.name || 'Cliente'}
                    </h5>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-0.5">
                      <Receipt className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {item.ordersCount} {item.ordersCount === 1 ? 'cuenta pendiente' : 'cuentas pendientes'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Debt amount & Clickable indicator */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      Saldo Deudor
                    </span>
                    <span className="font-extrabold text-rose-600 text-base sm:text-lg tracking-tight">
                      {formatCurrency(item.totalDebt)}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 text-slate-400 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
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

      {/* Modal para ver deudas detalladas y abonar con total flexibilidad */}
      {selectedCustomerForDebts && (
        <CustomerDebtsModal
          customerDebtData={selectedCustomerForDebts}
          isOpen={Boolean(selectedCustomerForDebts)}
          onClose={() => setSelectedCustomerForDebts(null)}
        />
      )}
    </div>
  );
};
