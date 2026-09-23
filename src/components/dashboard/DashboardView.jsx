import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from './StatCard';
import { RecentSales } from './RecentSales';
import { PendingDebtsWidget } from './PendingDebtsWidget';
import { RecentActivity } from './RecentActivity';
import {
  IconSales,
  IconExpenses,
  IconCustomers,
  IconInventory
} from '../common/StocklyIcons';
import {
  Calendar,
  Clock,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X
} from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export const DashboardView = () => {
  const { data, formatCurrency, dateRange, setDateRange, setActiveTab } = useApp();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [pickerMode, setPickerMode] = useState('month'); // 'month' | 'year'
  const [isPickerOpen, setIsPickerOpen] = useState(false);

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
    { id: 'today', label: 'Hoy', icon: Clock },
    { id: 'thisWeek', label: 'Esta semana', icon: CalendarDays },
    { id: 'thisMonth', label: 'Este mes', icon: Calendar },
    { id: 'thisYear', label: 'Este año', icon: CalendarRange },
  ];

  const isCustomActive = dateRange === 'customMonth' || dateRange === 'customYear';

  // Helper to parse dates safely
  const isDateInSelectedRange = (dateInput, range) => {
    if (!dateInput) return false;
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

    if (range === 'thisYear') {
      const yearStart = new Date(currentNow.getFullYear(), 0, 1, 0, 0, 0, 0);
      const yearEnd = new Date(currentNow.getFullYear(), 11, 31, 23, 59, 59, 999);
      return itemDate >= yearStart && itemDate <= yearEnd;
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

  // Filtered metrics based on the selected range
  const { totalSales, totalExpenses, totalCustomersCount, newCustomersCount, salesCount, periodLabel } = useMemo(() => {
    const orders = data.orders || [];
    const expenses = data.expenses || [];
    const customers = data.customers || [];

    const activeRange = dateRange || 'today';

    const validOrders = orders.filter((o) => {
      if (o.status === 'Cancelado') return false;
      const orderDate = o.createdAt || o.date;
      return isDateInSelectedRange(orderDate, activeRange);
    });

    const validExpenses = expenses.filter((e) => {
      const expDate = e.createdAt || e.date;
      return isDateInSelectedRange(expDate, activeRange);
    });

    const validCustomers = customers.filter((c) => {
      const custDate = c.createdAt || c.joinedDate;
      return isDateInSelectedRange(custDate, activeRange);
    });

    const salesSum = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const expSum = validExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const labels = {
      today: 'hoy',
      thisWeek: 'esta semana',
      thisMonth: 'este mes',
      thisYear: 'este año',
      customMonth: `${MONTH_NAMES[selectedMonth]} ${selectedYear}`,
      customYear: `el año ${selectedYear}`
    };

    const fallbackSales = orders.length === 0 ? Number(data.kpis?.totalSales || 0) : salesSum;
    const fallbackExpenses = expenses.length === 0 ? Number(data.kpis?.totalExpenses || 0) : expSum;

    return {
      totalSales: fallbackSales,
      totalExpenses: fallbackExpenses,
      totalCustomersCount: customers.length,
      newCustomersCount: validCustomers.length,
      salesCount: validOrders.length,
      periodLabel: labels[activeRange] || 'el período'
    };
  }, [data.orders, data.expenses, data.customers, data.kpis, dateRange, selectedMonth, selectedYear]);

  // All sales belonging to the active time range (without slicing)
  const periodOrders = useMemo(() => {
    const orders = data.orders || [];
    const activeRange = dateRange || 'today';
    return orders.filter((o) => {
      const orderDate = o.createdAt || o.date;
      return isDateInSelectedRange(orderDate, activeRange);
    });
  }, [data.orders, dateRange, selectedMonth, selectedYear]);

  const totalStockUnits = (data.products || []).reduce((sum, p) => sum + (Number(p.stock) || 0), 0);

  const handleSelectSpecificMonth = (monthIdx) => {
    setSelectedMonth(monthIdx);
    setDateRange('customMonth');
    setIsPickerOpen(false);
  };

  const handleSelectSpecificYear = (yearNum) => {
    setSelectedYear(yearNum);
    setDateRange('customYear');
    setIsPickerOpen(false);
  };

  const availableYears = [2023, 2024, 2025, 2026, 2027];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Custom Stockly Date Segmented Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>¡Bienvenido de vuelta, {data.storeInfo.user.name.split(' ')[0]}!</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Resumen de operaciones y métricas clave de <strong className="text-slate-700">{periodLabel}</strong>
          </p>
        </div>

        {/* Stockly Signature Segmented Date Filter */}
        <div className="relative self-start lg:self-auto flex items-center gap-1.5" ref={popoverRef}>
          <div className="bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-1 flex-wrap sm:flex-nowrap">
            {timeOptions.map((opt) => {
              const isSelected = (dateRange || 'today') === opt.id;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setDateRange(opt.id);
                    setIsPickerOpen(false);
                  }}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 select-none ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 active:scale-95'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 active:scale-98'
                  }`}
                >
                  <span>{opt.label}</span>
                </button>
              );
            })}

            {/* Separator */}
            <div className="h-4 w-px bg-slate-300 mx-0.5 hidden sm:block" />

            {/* Specific Month/Year Button */}
            <button
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 select-none ${
                isCustomActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 active:scale-95'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 active:scale-98'
              }`}
              title="Consultar un mes o año en específico"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {dateRange === 'customMonth'
                  ? `${MONTH_SHORT[selectedMonth]} ${selectedYear}`
                  : dateRange === 'customYear'
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
                    className={`px-3 py-1 rounded-lg transition-all ${
                      pickerMode === 'month'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Por Mes
                  </button>
                  <button
                    onClick={() => setPickerMode('year')}
                    className={`px-3 py-1 rounded-lg transition-all ${
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
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50"
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
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                      title="Año anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-extrabold text-sm text-slate-800 tracking-tight">
                      {selectedYear}
                    </span>
                    <button
                      onClick={() => setSelectedYear((y) => y + 1)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                      title="Año siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 12 Months Grid */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTH_SHORT.map((mShort, idx) => {
                      const isSelectedMonth =
                        dateRange === 'customMonth' &&
                        selectedMonth === idx;

                      return (
                        <button
                          key={mShort}
                          onClick={() => handleSelectSpecificMonth(idx)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center ${
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
                        dateRange === 'customYear' && selectedYear === yearNum;

                      return (
                        <button
                          key={yearNum}
                          onClick={() => handleSelectSpecificYear(yearNum)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
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
      </div>

      {/* Row 1: 4 KPI Cards aligned 1:1 with main Navbar sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Ventas"
          value={formatCurrency(totalSales)}
          icon={IconSales}
          iconBg="bg-blue-50/80 border-blue-200/70 text-blue-600 shadow-xs"
          onClick={() => setActiveTab('sales')}
        />

        <StatCard
          title="Gastos"
          value={formatCurrency(totalExpenses)}
          icon={IconExpenses}
          iconBg="bg-rose-50/80 border-rose-200/70 text-rose-600 shadow-xs"
          onClick={() => setActiveTab('expenses')}
        />

        <StatCard
          title="Clientes"
          value={Number(totalCustomersCount).toLocaleString('en-US')}
          icon={IconCustomers}
          iconBg="bg-purple-50/80 border-purple-200/70 text-purple-600 shadow-xs"
          onClick={() => setActiveTab('customers')}
        />

        <StatCard
          title="Inventario"
          value={`${totalStockUnits} u.`}
          icon={IconInventory}
          iconBg="bg-amber-50/80 border-amber-200/70 text-amber-600 shadow-xs"
          onClick={() => setActiveTab('inventory')}
        />
      </div>

      {/* Row 2: Últimas Ventas a ancho completo */}
      <div className="w-full">
        <RecentSales orders={periodOrders} periodLabel={periodLabel} activeRange={dateRange || 'today'} />
      </div>

      {/* Row 3: Cuentas por Cobrar (50%) y Actividad Reciente (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="h-full">
          <PendingDebtsWidget />
        </div>
        <div className="h-full">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};
