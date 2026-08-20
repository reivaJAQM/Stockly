import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { openWhatsAppReceipt } from '../../utils/whatsapp';
import {
  Plus,
  PlusCircle,
  Search,
  Receipt,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Calendar,
  MessageCircle,
  Trash2
} from 'lucide-react';

export const SalesView = () => {
  const {
    data,
    formatCurrency,
    setIsPOSOpen,
    setSelectedReceiptOrder,
    updateOrderStatus,
    deleteSale
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const filteredOrders = (data.orders || []).filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      order.items?.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || (order.paymentMethod || '').toLowerCase() === paymentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const totalSalesRevenue = (data.orders || [])
    .filter((o) => o.status !== 'Cancelado')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const completedOrdersCount = data.orders.filter((o) => o.status === 'Completado').length;
  const pendingOrdersCount = data.orders.filter((o) => o.status === 'Pendiente').length;

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
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ventas y Facturación
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Registra nuevas ventas y visualiza el historial de transacciones.
          </p>
        </div>

        <button
          onClick={() => setIsPOSOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Venta</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400">Total Ingresos Registrados</span>
            <h4 className="text-xl font-extrabold text-slate-900">{formatCurrency(totalSalesRevenue)}</h4>
            <span className="text-[10px] text-slate-500 font-medium">{data.orders.length} órdenes generadas</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400">Órdenes Completadas</span>
            <h4 className="text-xl font-extrabold text-emerald-600">{completedOrdersCount}</h4>
            <span className="text-[10px] text-emerald-500 font-medium">Pagadas y entregadas</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400">Órdenes Pendientes</span>
            <h4 className="text-xl font-extrabold text-amber-600">{pendingOrdersCount}</h4>
            <span className="text-[10px] text-amber-500 font-medium">Pendientes de cobro o envío</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por orden, cliente o producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="Completado">Completado</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Cancelado">Cancelado</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">Todos los métodos de pago</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Transferencia">Transferencia</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Orden #</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Método de Pago</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-6 text-right">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-blue-600">
                    {order.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-800">{order.customer?.name || "Cliente Mostrador"}</p>
                    <span className="text-[10px] text-slate-400">{order.customer?.email}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{order.date}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      {order.paymentMethod || "Efectivo"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`text-[11px] font-semibold border rounded-full px-2.5 py-0.5 cursor-pointer focus:outline-none ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      <option value="Completado">Completado</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openWhatsAppReceipt(order, data.storeInfo)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold inline-flex items-center gap-1 transition-colors border border-emerald-200/70"
                        title="Enviar o reenviar ticket por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => setSelectedReceiptOrder(order)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Ver Ticket</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de eliminar la orden ${order.id}? Se eliminará la venta y las unidades vendidas regresarán automáticamente al inventario.`)) {
                            deleteSale(order.id);
                          }
                        }}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"
                        title="Eliminar orden y restituir stock"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-semibold text-sm">No se encontraron ventas</p>
              <p className="text-xs">Usa el botón "+ Nueva Venta" para registrar tu primera venta.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
