import React from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  HandCoins,
  ChevronRight,
  Package,
  FileText
} from 'lucide-react';

export const CustomerHistoryModal = ({
  customer,
  isOpen,
  onClose,
  orders = [],
  formatCurrency,
  onOpenDebtModal
}) => {
  if (!isOpen || !customer) return null;

  // Filter orders matching this customer
  const customerOrders = orders.filter((o) => {
    if (o.status === 'Cancelado') return false;
    const matchId = (o.customerId && String(o.customerId) === String(customer.id)) ||
                    (o.customer?.id && String(o.customer.id) === String(customer.id));
    const matchName = o.customer?.name && customer.name &&
                      o.customer.name.trim().toLowerCase() === customer.name.trim().toLowerCase();
    return matchId || matchName;
  });

  const totalSpent = customerOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalDebt = customerOrders.reduce((sum, o) => {
    const bal = Number(o.balanceDue !== undefined ? o.balanceDue : (o.balance_due || 0));
    return sum + (bal > 0 ? bal : 0);
  }, 0);

  const pendingOrders = customerOrders.filter((o) => {
    const bal = Number(o.balanceDue !== undefined ? o.balanceDue : (o.balance_due || 0));
    return bal > 0;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-black text-xl flex-shrink-0 shadow-2xs">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">
                {customer.name}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Cliente registrado desde {customer.joinedDate || '2024'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact & Notes Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 text-xs border-b border-slate-100 text-slate-600 bg-slate-50/50 -mx-6 px-6">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-semibold text-slate-500">Teléfono:</span>
            {customer.phone ? (
              <a href={`tel:${customer.phone}`} className="font-mono font-bold text-slate-800 hover:text-blue-600">
                {customer.phone}
              </a>
            ) : (
              <span className="text-slate-400 italic">No registrado</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-semibold text-slate-500">Correo:</span>
            {customer.email ? (
              <a href={`mailto:${customer.email}`} className="text-slate-800 hover:text-blue-600 truncate">
                {customer.email}
              </a>
            ) : (
              <span className="text-slate-400 italic">No registrado</span>
            )}
          </div>
          {customer.notes && (
            <div className="col-span-full text-slate-600 text-[11px] bg-white p-2 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-700">Notas: </span>
              {customer.notes}
            </div>
          )}
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-3 gap-3 py-4">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Total Comprado
            </span>
            <span className="text-base font-extrabold text-blue-600">
              {formatCurrency(totalSpent)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Órdenes
            </span>
            <span className="text-base font-extrabold text-slate-800">
              {customerOrders.length}
            </span>
          </div>

          <div className={`p-3 rounded-2xl border text-center ${
            totalDebt > 0 ? 'bg-rose-50 border-rose-200/80 text-rose-700' : 'bg-emerald-50 border-emerald-200/80 text-emerald-700'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
              Saldo Deudor
            </span>
            <span className="text-base font-extrabold">
              {totalDebt > 0 ? formatCurrency(totalDebt) : 'Sin deuda'}
            </span>
          </div>
        </div>

        {/* Debt Action Button if customer has debt */}
        {totalDebt > 0 && onOpenDebtModal && (
          <div className="mb-4 p-3 bg-rose-50/80 border border-rose-200/80 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-xs">
                <HandCoins className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-900">
                  Tiene {pendingOrders.length} {pendingOrders.length === 1 ? 'orden pendiente' : 'órdenes pendientes'} de pago
                </p>
                <p className="text-[11px] text-rose-600">
                  Total adeudado: {formatCurrency(totalDebt)}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onOpenDebtModal(customer, pendingOrders);
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              Cobrar / Abonar
            </button>
          </div>
        )}

        {/* Orders History List */}
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Historial de Ventas ({customerOrders.length})
            </h4>
          </div>

          {customerOrders.length > 0 ? (
            <div className="space-y-2">
              {customerOrders.map((order) => {
                const bal = Number(order.balanceDue !== undefined ? order.balanceDue : (order.balance_due || 0));
                const isPaid = bal <= 0;

                return (
                  <div
                    key={order.id}
                    className="p-3 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/60 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900">
                            {order.id}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          }`}>
                            {isPaid ? 'Pagada' : `Debe ${formatCurrency(bal)}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{order.date || 'Reciente'}</span>
                          <span>•</span>
                          <span>{order.paymentMethod || 'Efectivo'}</span>
                          {order.items && order.items.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">
                                {order.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-black text-slate-900 block">
                        {formatCurrency(order.total)}
                      </span>
                      {bal > 0 && (
                        <span className="text-[10px] font-bold text-rose-600 block">
                          Pendiente: {formatCurrency(bal)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
              <p className="font-bold text-xs text-slate-600">Sin compras registradas aún</p>
              <p className="text-[11px] text-slate-400">
                Las órdenes asociadas a este cliente aparecerán aquí automáticamente.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end mt-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
