import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../dashboard/StatCard';
import { AddPaymentModal } from './AddPaymentModal';
import { CustomSelect } from '../common/CustomSelect';
import {
  Plus,
  Search,
  Receipt,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  CalendarDays,
  Trash2,
  HandCoins,
  X,
  RotateCcw,
  Banknote,
  ArrowRightLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';

const MONTH_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const availableYears = [2023, 2024, 2025, 2026, 2027];

export const SalesView = () => {
  const {
    data,
    formatCurrency,
    setIsPOSOpen,
    setSelectedReceiptOrder,
    deleteSale
  } = useApp();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [pickerMode, setPickerMode] = useState('month'); // 'month' | 'year'
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'customMonth' | 'customYear'

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);

  const popoverRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsPickerOpen(false);
      }
    };
    if (isPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPickerOpen]);

  const timeOptions = [
    { id: 'all', label: 'Todo' },
    { id: 'today', label: 'Hoy', icon: Clock },
    { id: 'thisWeek', label: 'Esta semana', icon: CalendarDays },
    { id: 'thisMonth', label: 'Este mes', icon: Calendar },
  ];

  const isCustomActive = dateFilter === 'customMonth' || dateFilter === 'customYear';

  // Helper to parse dates safely
  const isDateInSelectedRange = (dateInput, range) => {
    if (!dateInput) return false;
    if (range === 'all') return true;

    const itemDate = new Date(dateInput);
    if (isNaN(itemDate.getTime())) return true;

    const currentNow = new Date();
    const todayStart = new Date(currentNow.getFullYear(), currentNow.getMonth(), currentNow.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(currentNow.getFullYear(), currentNow.getMonth(), currentNow.getDate(), 23, 59, 59, 999);

    if (range === 'today') {
      return itemDate >= todayStart && itemDate <= todayEnd;
    }

    if (range === 'thisWeek') {
      const dayOfWeek = currentNow.getDay();
      const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      const weekStart = new Date(currentNow.getFullYear(), currentNow.getMonth(), currentNow.getDate() + diffToMonday, 0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return itemDate >= weekStart && itemDate <= weekEnd;
    }

    if (range === 'thisMonth') {
      const monthStart = new Date(currentNow.getFullYear(), currentNow.getMonth(), 1, 0, 0, 0, 0);
      const monthEnd = new Date(currentNow.getFullYear(), currentNow.getMonth() + 1, 0, 23, 59, 59, 999);
      return itemDate >= monthStart && itemDate <= monthEnd;
    }

    if (range === 'customMonth') {
      const mStart = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);
      const mEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
      return itemDate >= mStart && itemDate <= mEnd;
    }

    if (range === 'customYear') {
      const yStart = new Date(selectedYear, 0, 1, 0, 0, 0, 0);
      const yEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      return itemDate >= yStart && itemDate <= yEnd;
    }

    return true;
  };

  const handleSelectSpecificMonth = (monthIdx) => {
    setSelectedMonth(monthIdx);
    setDateFilter('customMonth');
    setIsPickerOpen(false);
  };

  const handleSelectSpecificYear = (yearNum) => {
    setSelectedYear(yearNum);
    setDateFilter('customYear');
    setIsPickerOpen(false);
  };

  const orders = data.orders || [];

  // Metrics based on the active date filter
  const periodOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = o.createdAt || o.date;
      return isDateInSelectedRange(orderDate, dateFilter);
    });
  }, [orders, dateFilter, selectedMonth, selectedYear]);

  const totalSalesRevenue = periodOrders
    .filter((o) => o.status !== 'Cancelado')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const totalCollected = periodOrders
    .filter((o) => o.status !== 'Cancelado')
    .reduce((sum, o) => sum + (Number(o.amountPaid !== undefined ? o.amountPaid : (o.amount_paid || (o.status === 'Completado' ? o.total : 0))) || 0), 0);

  const totalPendingReceivable = periodOrders
    .filter((o) => o.status !== 'Cancelado')
    .reduce((sum, o) => sum + (Number(o.balanceDue !== undefined ? o.balanceDue : (o.balance_due || 0)) || 0), 0);

  // Filtered orders with search, status, and payment filters applied
  const filteredOrders = useMemo(() => {
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
      const orderDate = order.createdAt || order.date;
      const matchesDate = isDateInSelectedRange(orderDate, dateFilter);

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [orders, search, statusFilter, paymentFilter, dateFilter, selectedMonth, selectedYear]);

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
    <div className="space-y-6 pb-12">
      {/* Top Header with Segmented Date Filter and Actions */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ventas y Facturación
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Registra ventas al contado, a crédito y gestiona abonos de clientes.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap self-start xl:self-auto">
          {/* Stockly Signature Segmented Date Filter (Dashboard Style) */}
          <div className="relative flex items-center gap-1.5" ref={popoverRef}>
            <div className="bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-1 flex-wrap sm:flex-nowrap">
              {timeOptions.map((opt) => {
                const isSelected = dateFilter === opt.id;
                const Icon = opt.icon;

                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setDateFilter(opt.id);
                      setIsPickerOpen(false);
                    }}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 select-none cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 active:scale-95'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 active:scale-98'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}

              {/* Separator */}
              <div className="h-4 w-px bg-slate-300 mx-0.5 hidden sm:block" />

              {/* Specific Month/Year Button */}
              <button
                onClick={() => setIsPickerOpen(!isPickerOpen)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 select-none cursor-pointer ${
                  isCustomActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 active:scale-95'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 active:scale-98'
                }`}
                title="Consultar un mes o año en específico"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {dateFilter === 'customMonth'
                    ? `${MONTH_SHORT[selectedMonth]} ${selectedYear}`
                    : dateFilter === 'customYear'
                    ? `Año ${selectedYear}`
                    : 'Mes / Año'}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isPickerOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Floating Popover for Specific Month/Year */}
            {isPickerOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-3xl p-4 shadow-2xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Header Mode Switcher */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setPickerMode('month')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        pickerMode === 'month'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Por Mes
                    </button>
                    <button
                      onClick={() => setPickerMode('year')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        pickerMode === 'year'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Por Año
                    </button>
                  </div>

                  <button
                    onClick={() => setIsPickerOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Month Mode */}
                {pickerMode === 'month' && (
                  <div>
                    {/* Year Selector in Month Mode */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <button
                        onClick={() => setSelectedYear((y) => y - 1)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                        title="Año anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="font-extrabold text-sm text-slate-800 tracking-tight">
                        {selectedYear}
                      </span>
                      <button
                        onClick={() => setSelectedYear((y) => y + 1)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                        title="Año siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 12 Months Grid */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {MONTH_SHORT.map((mShort, idx) => {
                        const isSelectedMonth =
                          dateFilter === 'customMonth' &&
                          selectedMonth === idx;

                        return (
                          <button
                            key={mShort}
                            onClick={() => handleSelectSpecificMonth(idx)}
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                              isSelectedMonth
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                          >
                            {mShort}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Year Mode */}
                {pickerMode === 'year' && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2 px-1">
                      Selecciona un año completo:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {availableYears.map((yearNum) => {
                        const isSelectedYear =
                          dateFilter === 'customYear' && selectedYear === yearNum;

                        return (
                          <button
                            key={yearNum}
                            onClick={() => handleSelectSpecificYear(yearNum)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              isSelectedYear
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                : 'bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                          >
                            <span>{yearNum}</span>
                            {isSelectedYear && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nueva Venta Button */}
          <button
            onClick={() => setIsPOSOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Venta</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Facturado"
          value={formatCurrency(totalSalesRevenue)}
          icon={DollarSign}
          iconBg="bg-blue-50 border-blue-100 text-blue-600"
          onClick={() => handleResetFilters()}
        />

        <StatCard
          title="Total Cobrado"
          value={formatCurrency(totalCollected)}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 border-emerald-100 text-emerald-600"
          onClick={() => setStatusFilter('Completado')}
        />

        <StatCard
          title="Por Cobrar"
          value={formatCurrency(totalPendingReceivable)}
          icon={HandCoins}
          iconBg="bg-amber-50 border-amber-100 text-amber-600"
          onClick={() => setStatusFilter('Pendiente')}
        />
      </div>

      {/* Search & Filter Bar (Stockly Style) */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Search input */}
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ID (#ORD-00001), cliente o producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters & Counter */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto text-xs">
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

      {/* Orders Table - Stockly Dashboard Style (Harmonious, Centered, Elegant) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm">
        <div className="overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-xs">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700 text-sm">No se encontraron ventas</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {hasActiveFilters
                  ? 'Prueba ajustando los filtros o restableciéndolos con el botón "Limpiar".'
                  : 'Usa el botón "+ Nueva Venta" para registrar tu primera venta.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="mt-3 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Filtros</span>
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100/90 pb-3">
                  <th className="pb-3 px-3 text-center font-semibold whitespace-nowrap w-[14%]">Orden</th>
                  <th className="pb-3 px-3 text-center font-semibold w-[24%]">Cliente</th>
                  <th className="pb-3 px-3 text-center font-semibold whitespace-nowrap w-[14%]">Pago</th>
                  <th className="pb-3 px-3 text-center font-semibold whitespace-nowrap w-[14%]">Fecha</th>
                  <th className="pb-3 px-3 text-center font-semibold whitespace-nowrap w-[12%]">Total</th>
                  <th className="pb-3 px-3 text-center font-semibold whitespace-nowrap w-[10%]">Estado</th>
                  <th className="pb-3 px-3 text-center font-semibold whitespace-nowrap w-[12%]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {filteredOrders.map((order) => {
                  const isCredit = (order.paymentMethod || '').toLowerCase().includes('crédito') || (order.paymentMethod || '').toLowerCase().includes('credito') || (order.paymentMethod || '').toLowerCase().includes('fiado');
                  const balanceDue = Number(order.balanceDue !== undefined ? order.balanceDue : (order.balance_due || 0));

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/90 transition-colors group cursor-pointer"
                      onClick={() => setSelectedReceiptOrder(order)}
                    >
                      {/* ID Orden */}
                      <td className="py-3.5 px-3 text-center font-bold text-blue-600 group-hover:underline whitespace-nowrap tabular-nums">
                        {order.id}
                      </td>

                      {/* Cliente (solo nombre con avatar inicial, centrado) */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                            {(order.customer?.name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-800 text-xs truncate max-w-[160px]">
                            {order.customer?.name || 'Consumidor Final'}
                          </span>
                        </div>
                      </td>

                      {/* Método de Pago */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-slate-100/80 text-slate-700 text-[11px] font-semibold">
                          {getPaymentIcon(order.paymentMethod)}
                          <span>{order.paymentMethod || 'Efectivo'}</span>
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="py-3.5 px-3 text-center text-slate-500 text-[11px] whitespace-nowrap">
                        {order.date}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center">
                          <span className="font-extrabold text-slate-900 text-xs tabular-nums">
                            {formatCurrency(order.total)}
                          </span>
                          {isCredit && (
                            balanceDue > 0 ? (
                              <span className="text-[10px] font-extrabold text-rose-600 whitespace-nowrap mt-0.5">
                                Debe: {formatCurrency(balanceDue)}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-600 whitespace-nowrap mt-0.5">
                                Pagado
                              </span>
                            )
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td
                        className="py-3.5 px-3 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Botón de Abonar si tiene saldo pendiente */}
                          {balanceDue > 0 && (
                            <button
                              onClick={() => setPaymentModalOrder(order)}
                              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                              title="Registrar abono a esta cuenta"
                            >
                              <HandCoins className="w-3 h-3 text-amber-400" />
                              <span>Abonar</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedReceiptOrder(order)}
                            className="px-2.5 py-1 rounded-xl bg-slate-100/90 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors border border-slate-200/60 cursor-pointer"
                            title="Ver e imprimir ticket"
                          >
                            <Receipt className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600" />
                            <span>Ticket</span>
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de eliminar la orden ${order.id}? Se eliminará la venta y las unidades vendidas regresarán automáticamente al inventario.`)) {
                                deleteSale(order.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar orden y restituir stock"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Footer Summary */}
        {filteredOrders.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 font-medium">
              Mostrando {filteredOrders.length} {filteredOrders.length === 1 ? 'venta' : 'ventas'}
            </span>
            <span className="text-[11px] font-bold text-slate-600">
              Total: {formatCurrency(filteredOrders.filter(o => o.status !== 'Cancelado').reduce((sum, o) => sum + (Number(o.total) || 0), 0))}
            </span>
          </div>
        )}
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
