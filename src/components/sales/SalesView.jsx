import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AddPaymentModal } from './AddPaymentModal';
import { CustomSelect } from '../common/CustomSelect';
import {
  Plus,
  Search,
  Receipt,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  Calendar,
  Trash2,
  HandCoins,
  AlertCircle,
  X,
  RotateCcw,
  Banknote,
  ArrowRightLeft,
  ChevronDown
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
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);

  const orders = data.orders || [];

  // Metrics
  const totalSalesRevenue = orders
    .filter((o) => o.status !== 'Cancelado')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const totalCollected = orders
    .filter((o) => o.status !== 'Cancelado')
    .reduce((sum, o) => sum + (Number(o.amountPaid || o.amount_paid || (o.status === 'Completado' ? o.total : 0)) || 0), 0);

  const totalPendingReceivable = orders
    .filter((o) => o.status !== 'Cancelado')
    .reduce((sum, o) => sum + (Number(o.balanceDue !== undefined ? o.balanceDue : (o.balance_due || 0)) || 0), 0);

  // Status counts for filter pills
  const completedCount = orders.filter((o) => o.status === 'Completado').length;
  const pendingCount = orders.filter((o) => o.status === 'Pendiente' || Number(o.balanceDue || o.balance_due || 0) > 0).length;
  const cancelledCount = orders.filter((o) => o.status === 'Cancelado').length;

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    return orders.filter((order) => {
      // Search
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customer?.name.toLowerCase().includes(q) ||
        order.customer?.phone?.toLowerCase().includes(q) ||
        order.items?.some((i) => i.name.toLowerCase().includes(q));

      // Status
      let matchesStatus = true;
      if (statusFilter === 'Completado') {
        matchesStatus = order.status === 'Completado';
      } else if (statusFilter === 'Pendiente') {
        matchesStatus = order.status === 'Pendiente' || Number(order.balanceDue || order.balance_due || 0) > 0;
      } else if (statusFilter === 'Cancelado') {
        matchesStatus = order.status === 'Cancelado';
      }

      // Payment method
      let matchesPayment = true;
      if (paymentFilter !== 'all') {
        matchesPayment = (order.paymentMethod || '').toLowerCase().includes(paymentFilter.toLowerCase());
      }

      // Date range filter
      let matchesDate = true;
      if (dateFilter !== 'all' && order.createdAt) {
        const orderDate = new Date(order.createdAt);
        if (dateFilter === 'today') {
          matchesDate = orderDate.toDateString() === todayStr;
        } else if (dateFilter === 'week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          matchesDate = orderDate >= oneWeekAgo;
        } else if (dateFilter === 'month') {
          matchesDate =
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [orders, search, statusFilter, paymentFilter, dateFilter]);

  const hasActiveFilters = search !== '' || statusFilter !== 'all' || paymentFilter !== 'all' || dateFilter !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setDateFilter('all');
  };

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

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ventas y Facturación
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Registra ventas al contado, a crédito y gestiona abonos de clientes.
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
        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Facturado</p>
            <h3 className="text-xl font-extrabold text-slate-900">
              {formatCurrency(totalSalesRevenue)}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Ventas totales registradas</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Cobrado</p>
            <h3 className="text-xl font-extrabold text-emerald-600">
              {formatCurrency(totalCollected)}
            </h3>
            <p className="text-[11px] text-emerald-700 font-medium">Ingresado en caja</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <HandCoins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Por Cobrar</p>
            <h3 className="text-xl font-extrabold text-amber-600">
              {formatCurrency(totalPendingReceivable)}
            </h3>
            <p className="text-[11px] text-amber-700 font-medium">Cuentas pendientes de pago</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar (Stockly Style) */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Search input */}
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ID (#ORD-00001), cliente o producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters & Counter */}
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto text-xs">
          {/* Status filter */}
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'Completado', label: 'Completados' },
              { value: 'Pendiente', label: 'Pendientes' },
              { value: 'Cancelado', label: 'Cancelados' }
            ]}
          />

          {/* Payment method filter */}
          <CustomSelect
            value={paymentFilter}
            onChange={setPaymentFilter}
            options={[
              { value: 'all', label: 'Todos los métodos' },
              { value: 'Efectivo', label: 'Efectivo' },
              { value: 'Transferencia', label: 'Transferencia' },
              { value: 'Crédito', label: 'Crédito' }
            ]}
          />

          {/* Date range filter */}
          <CustomSelect
            value={dateFilter}
            onChange={setDateFilter}
            options={[
              { value: 'all', label: 'Todo el historial' },
              { value: 'today', label: 'Hoy' },
              { value: 'week', label: 'Últimos 7 días' },
              { value: 'month', label: 'Este mes' }
            ]}
          />

          {/* Reset Filters button if any is active */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-2xl border border-rose-100 transition-colors active:scale-95 cursor-pointer"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          )}

          {/* Counter Badge */}
          <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100 whitespace-nowrap">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'venta' : 'ventas'}
          </span>
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
                <th className="py-3.5 px-4">Condición de Pago</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.map((order) => {
                const isCredit = (order.paymentMethod || '').toLowerCase().includes('crédito') || (order.paymentMethod || '').toLowerCase().includes('credito') || (order.paymentMethod || '').toLowerCase().includes('fiado');
                const balanceDue = Number(order.balanceDue !== undefined ? order.balanceDue : (order.balance_due || 0));
                const amountPaid = Number(order.amountPaid !== undefined ? order.amountPaid : (order.amount_paid || (order.status === 'Completado' ? order.total : 0)));

                return (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-blue-600 whitespace-nowrap">
                      {order.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{order.customer?.name || "Consumidor Final"}</p>
                      <span className="text-[10px] text-slate-400">
                        {order.customer?.phone && order.customer?.phone !== 'N/A' ? order.customer?.phone : order.customer?.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{order.date}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-xl font-semibold text-[11px] inline-flex items-center gap-1.5 ${isCredit
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : order.paymentMethod === 'Transferencia'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        }`}>
                        {isCredit ? (
                          <HandCoins className="w-3 h-3 text-amber-700" />
                        ) : order.paymentMethod === 'Transferencia' ? (
                          <ArrowRightLeft className="w-3 h-3 text-purple-600" />
                        ) : (
                          <Banknote className="w-3 h-3 text-emerald-600" />
                        )}
                        <span>{order.paymentMethod || "Efectivo"}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {formatCurrency(order.total)}
                      </div>
                      {isCredit && (
                        balanceDue > 0 ? (
                          <span className="text-[10px] font-extrabold text-rose-600 block">
                            Debe: {formatCurrency(balanceDue)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-600 block">
                            Pagado al 100%
                          </span>
                        )
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[11px] font-bold border rounded-full px-2.5 py-1 inline-flex items-center gap-1.5 shadow-2xs select-none ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status === 'Completado' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {order.status === 'Pendiente' && <Clock className="w-3 h-3 text-amber-600" />}
                        {order.status === 'Cancelado' && <XCircle className="w-3 h-3 text-rose-600" />}
                        <span>{order.status || 'Completado'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón de Abonar si tiene saldo pendiente */}
                        {balanceDue > 0 && (
                          <button
                            onClick={() => setPaymentModalOrder(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                            title="Registrar abono a esta cuenta"
                          >
                            <HandCoins className="w-3.5 h-3.5 text-amber-400" />
                            <span>Abonar</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors border border-slate-200/60 cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Ticket</span>
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`¿Estás seguro de eliminar la orden ${order.id}? Se eliminará la venta y las unidades vendidas regresarán automáticamente al inventario.`)) {
                              deleteSale(order.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar orden y restituir stock"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-semibold text-sm">No se encontraron ventas</p>
              <p className="text-xs">
                {hasActiveFilters
                  ? 'Prueba ajustando los filtros o restableciéndolos con el botón "Limpiar filtros".'
                  : 'Usa el botón "+ Nueva Venta" para registrar tu primera venta.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="mt-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Restablecer Filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal para Registrar Abono */}
      {paymentModalOrder && (
        <AddPaymentModal
          order={paymentModalOrder}
          isOpen={Boolean(paymentModalOrder)}
          onClose={() => setPaymentModalOrder(null)}
        />
      )}
    </div>
  );
};
