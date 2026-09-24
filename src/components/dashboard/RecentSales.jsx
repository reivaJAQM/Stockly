import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingBag,
  Receipt,
  ArrowRight,
  Banknote,
  ArrowRightLeft,
  HandCoins,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';

export const RecentSales = ({ orders, periodLabel = 'hoy', activeRange = 'today' }) => {
  const {
    data,
    formatCurrency,
    setActiveTab,
    setSelectedReceiptOrder,
    setIsPOSOpen
  } = useApp();

  const recentOrders = orders !== undefined ? orders : (data.orders || []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completado':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'Pendiente':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'Cancelado':
        return 'bg-rose-50 text-rose-700 border-rose-200/80';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPaymentIcon = (method) => {
    const m = (method || '').toLowerCase();
    if (m.includes('efectivo') || m.includes('cash')) {
      return <Banknote className="w-3.5 h-3.5 text-emerald-600" />;
    }
    if (m.includes('crédito') || m.includes('credito') || m.includes('fiado')) {
      return <HandCoins className="w-3.5 h-3.5 text-amber-600" />;
    }
    return <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />;
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between h-full min-h-[380px]">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
              Registro de Ventas
            </h4>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {recentOrders.length > 0
                ? `${recentOrders.length} ${recentOrders.length === 1 ? 'venta realizada' : 'ventas realizadas'} ${activeRange === 'today' ? 'el día de hoy' : `en ${periodLabel}`}`
                : activeRange === 'today'
                  ? 'Sin ventas registradas hoy'
                  : `Sin ventas en ${periodLabel}`}
            </p>
          </div>

          <button
            onClick={() => setActiveTab('sales')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs border border-slate-200/80 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Content Table / Empty State */}
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto flex-1 flex flex-col justify-start">
          {recentOrders.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center my-auto">
              <div className="w-14 h-14 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center mb-3 text-blue-600 shadow-2xs">
                <ShoppingBag className="w-7 h-7 stroke-[1.75]" />
              </div>
              <p className="font-extrabold text-sm text-slate-800 mb-1">
                {activeRange === 'today'
                  ? 'No hay ventas registradas el día de hoy'
                  : `No hay ventas registradas en ${periodLabel}`}
              </p>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
                {activeRange === 'today'
                  ? 'Cuando cobres o generes ventas desde el Punto de Venta hoy, tus pedidos aparecerán aquí con su detalle.'
                  : 'No se encontraron pedidos registrados dentro del período seleccionado.'}
              </p>
              <button
                onClick={() => setIsPOSOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                + Realizar primera venta
              </button>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100/90 pb-3">
                  <th className="pb-3 px-2 text-left font-semibold w-[15%]">Orden</th>
                  <th className="pb-3 px-2 text-center font-semibold w-[26%]">Cliente</th>
                  <th className="pb-3 px-2 text-center font-semibold w-[14%] hidden md:table-cell">Pago</th>
                  <th className="pb-3 px-2 text-center font-semibold w-[15%] hidden sm:table-cell">Fecha</th>
                  <th className="pb-3 px-2 text-center font-semibold w-[10%]">Total</th>
                  <th className="pb-3 px-2 text-center font-semibold w-[10%]">Estado</th>
                  <th className="pb-3 px-2 text-center font-semibold w-[10%]">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {recentOrders.map((order) => {
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/90 transition-colors group cursor-pointer"
                      onClick={() => setSelectedReceiptOrder(order)}
                    >
                      {/* ID Orden */}
                      <td className="py-3.5 px-2 text-left font-bold text-blue-600 group-hover:underline whitespace-nowrap">
                        {order.id}
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-2 text-center">
                        <span className="font-bold text-slate-800 text-xs truncate inline-block max-w-[160px]">
                          {order.customer?.name || 'Consumidor Final'}
                        </span>
                      </td>

                      {/* Método de Pago */}
                      <td className="py-3.5 px-2 text-center hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xl bg-slate-100/80 text-slate-700 text-[11px] font-semibold">
                          {getPaymentIcon(order.paymentMethod)}
                          <span>{order.paymentMethod || 'Efectivo'}</span>
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="py-3.5 px-2 text-center text-slate-500 text-[11px] hidden sm:table-cell whitespace-nowrap">
                        {order.date}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-2 text-center font-extrabold text-slate-900 text-xs whitespace-nowrap">
                        {formatCurrency(order.total)}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-2 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Comprobante / Ticket */}
                      <td className="py-3.5 px-2 text-center">
                        <div
                          className="flex items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setSelectedReceiptOrder(order)}
                            className="px-2.5 py-1 rounded-xl bg-slate-100/90 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors border border-slate-200/60"
                            title="Ver ticket de venta"
                          >
                            <Receipt className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600" />
                            <span>Ticket</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {recentOrders.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 font-medium">
            Mostrando {recentOrders.length} {recentOrders.length === 1 ? 'venta' : 'ventas'} ({periodLabel})
          </span>
          <button
            onClick={() => setActiveTab('sales')}
            className="font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
          >
            <span>Ver historial completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
