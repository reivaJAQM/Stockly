import React from 'react';
import { useApp } from '../../context/AppContext';

export const RecentSales = () => {
  const { data, formatCurrency, setActiveTab, setSelectedReceiptOrder } = useApp();

  const recentOrders = (data.orders || []).slice(0, 5);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completado':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200/60';
      case 'Pendiente':
        return 'bg-amber-50 text-amber-600 border-amber-200/60';
      case 'Cancelado':
        return 'bg-rose-50 text-rose-600 border-rose-200/60';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between h-full min-h-[340px]">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-900">Ventas recientes</h4>
        </div>

        <div className="overflow-x-auto flex-1 flex flex-col justify-center">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100">
                <th className="pb-3 font-semibold">Orden</th>
                <th className="pb-3 font-semibold">Cliente</th>
                <th className="pb-3 font-semibold">Fecha</th>
                <th className="pb-3 font-semibold">Total</th>
                <th className="pb-3 font-semibold text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 text-xs">
                    No hay ventas registradas aún. Haz clic en "+ Nueva Venta" para registrar tu primera venta.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedReceiptOrder(order)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 font-bold text-blue-600 group-hover:underline">
                      {order.id}
                    </td>
                    <td className="py-3.5 text-slate-800 font-semibold truncate max-w-[120px]">
                      {order.customer.name}
                    </td>
                    <td className="py-3.5 text-slate-500">{order.date}</td>
                    <td className="py-3.5 font-bold text-slate-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3.5 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
        <button
          onClick={() => setActiveTab('sales')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
        >
          Ver todas las ventas
        </button>
      </div>
    </div>
  );
};
