import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../dashboard/StatCard';
import { CustomSelect } from '../common/CustomSelect';
import {
  Plus,
  Search,
  Receipt,
  DollarSign,
  TrendingDown,
  Trash2,
  Calendar,
  Clock,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Wallet,
  Tag
} from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const availableYears = [2023, 2024, 2025, 2026, 2027];

export const ExpensesView = () => {
  const {
    data,
    formatCurrency,
    setIsExpenseModalOpen,
    deleteExpense,
    expenseCategories = []
  } = useApp();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [pickerMode, setPickerMode] = useState('month'); // 'month' | 'year'
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('today'); // 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'customMonth' | 'customYear'

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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
    { id: 'thisYear', label: 'Este año', icon: CalendarRange }
  ];

  const isCustomActive = dateFilter === 'customMonth' || dateFilter === 'customYear';

  // Helper to parse and compare dates safely (avoids timezone rollbacks)
  const isDateInSelectedRange = (dateInput, range) => {
    if (!dateInput) return false;
    if (range === 'all') return true;

    const dateStr = String(dateInput);
    const itemDate = new Date(dateStr.length === 10 ? `${dateStr}T12:00:00` : dateStr);
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

  const expenses = data.expenses || [];
  const orders = data.orders || [];

  // 1. Filter expenses & sales for the active date range to power the StatCards
  const periodExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = e.date || e.createdAt;
      return isDateInSelectedRange(d, dateFilter);
    });
  }, [expenses, dateFilter, selectedMonth, selectedYear]);

  const periodOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.status === 'Cancelado') return false;
      const d = o.date || o.createdAt;
      return isDateInSelectedRange(d, dateFilter);
    });
  }, [orders, dateFilter, selectedMonth, selectedYear]);

  // Financial KPI calculations - 100% NaN-safe
  const totalPeriodExpenses = useMemo(() => {
    return periodExpenses.reduce((sum, e) => {
      const val = Number(e.amount);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [periodExpenses]);

  const totalPeriodSales = useMemo(() => {
    if (dateFilter === 'all' && periodOrders.length === 0 && Number(data.kpis?.totalSales || 0) > 0) {
      return Number(data.kpis.totalSales);
    }
    return periodOrders.reduce((sum, o) => {
      const val = Number(o.total);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [periodOrders, dateFilter, data.kpis?.totalSales]);

  const netProfit = totalPeriodSales - totalPeriodExpenses;

  // 2. Filter expenses for the table (combines date filter + category + text search)
  const filteredExpenses = useMemo(() => {
    return periodExpenses.filter((e) => {
      const matchesSearch =
        (e.concept || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.supplier && e.supplier.toLowerCase().includes(search.toLowerCase())) ||
        (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()));

      const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [periodExpenses, search, selectedCategory]);

  // Unique categories list for expenses only (completely separated from inventory products)
  const categories = useMemo(() => {
    return ['all', ...(expenseCategories || [])];
  }, [expenseCategories]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header with Stockly Segmented Date Filter */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Control de Gastos y Egresos
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap self-start xl:self-auto">
          {/* Stockly Signature Segmented Date Filter (Dashboard Style) */}
          <div className="relative flex items-center gap-1.5" ref={popoverRef}>
            <div className="bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-1 flex-wrap sm:flex-nowrap">
              {timeOptions.map((opt) => {
                const isSelected = dateFilter === opt.id;

                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setDateFilter(opt.id);
                      setIsPickerOpen(false);
                    }}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 select-none cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25 active:scale-95'
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
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 select-none cursor-pointer ${
                  isCustomActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25 active:scale-95'
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
                          ? 'bg-white text-rose-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Por Mes
                    </button>
                    <button
                      onClick={() => setPickerMode('year')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        pickerMode === 'year'
                          ? 'bg-white text-rose-600 shadow-xs'
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

                    <div className="grid grid-cols-3 gap-1.5">
                      {MONTH_SHORT.map((mShort, idx) => {
                        const isSelectedMonth =
                          dateFilter === 'customMonth' && selectedMonth === idx;

                        return (
                          <button
                            key={mShort}
                            onClick={() => handleSelectSpecificMonth(idx)}
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                              isSelectedMonth
                                ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/30'
                                : 'text-slate-700 hover:bg-rose-50 hover:text-rose-600'
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
                    <div className="text-xs font-bold text-slate-400 mb-2 px-1">
                      Selecciona un año:
                    </div>
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
                                ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/30'
                                : 'bg-slate-50 text-slate-700 hover:bg-rose-50 hover:text-rose-600'
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

          {/* Quick Register Button */}
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-extrabold rounded-2xl shadow-md shadow-rose-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Financial Health Summary Cards - Dynamic with Selected Date Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Gastos"
          value={formatCurrency(totalPeriodExpenses)}
          icon={TrendingDown}
          iconBg="bg-rose-50 border-rose-100 text-rose-600"
        />

        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(totalPeriodSales)}
          icon={DollarSign}
          iconBg="bg-blue-50 border-blue-100 text-blue-600"
        />

        <StatCard
          title="Utilidad Neta"
          value={formatCurrency(netProfit)}
          icon={Wallet}
          valueColor={netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}
          iconBg={netProfit >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por concepto, beneficiario o notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 font-medium placeholder:text-slate-400"
          />
        </div>

        <CustomSelect
          value={selectedCategory}
          onChange={setSelectedCategory}
          options={categories.map((c) => ({
            value: c,
            label: c === 'all' ? 'Todas las categorías' : c
          }))}
          icon={Tag}
        />
      </div>

      {/* Expenses Table - Stockly Dashboard Style */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm">
        <div className="overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <div className="py-14 text-center text-slate-400 space-y-2">
              <Receipt className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">No se encontraron gastos</p>
              <p className="text-xs text-slate-400">
                {dateFilter === 'all'
                  ? 'Usa el botón "Registrar Gasto" para agregar tu primer egreso.'
                  : 'No hay gastos registrados en el período o filtros seleccionados.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100/90 pb-3">
                  <th className="pb-3 px-3 text-left font-semibold">Concepto / Gasto</th>
                  <th className="pb-3 px-3 text-center font-semibold">Categoría</th>
                  <th className="pb-3 px-3 text-center font-semibold">Fecha</th>
                  <th className="pb-3 px-3 text-center font-semibold">Beneficiario</th>
                  <th className="pb-3 px-3 text-center font-semibold">Monto</th>
                  <th className="pb-3 px-3 text-center font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {filteredExpenses.map((expense) => {
                  const amt = Number(expense.amount);
                  const validAmt = isNaN(amt) ? 0 : amt;

                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/90 transition-colors group">
                      {/* Concepto */}
                      <td className="py-3.5 px-3 text-left">
                        <p className="font-bold text-slate-800 text-xs">{expense.concept}</p>
                        {expense.notes && (
                          <span className="text-[10px] text-slate-400">{expense.notes}</span>
                        )}
                      </td>

                      {/* Categoría */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full text-[10px] font-bold">
                          {expense.category || 'General'}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="py-3.5 px-3 text-center text-slate-500 text-[11px] whitespace-nowrap">
                        {expense.date}
                      </td>

                      {/* Beneficiario */}
                      <td className="py-3.5 px-3 text-center text-slate-700 text-xs">
                        {expense.supplier || 'N/A'}
                      </td>

                      {/* Monto */}
                      <td className="py-3.5 px-3 text-center font-extrabold text-rose-600 text-xs tabular-nums whitespace-nowrap">
                        -{formatCurrency(validAmt)}
                      </td>

                      {/* Acción */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Eliminar gasto "${expense.concept}"?`)) {
                              deleteExpense(expense.id);
                            }
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar gasto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {filteredExpenses.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 font-medium">
              Mostrando {filteredExpenses.length} {filteredExpenses.length === 1 ? 'gasto' : 'gastos'}
            </span>
            <span className="text-[11px] font-bold text-slate-700">
              Total: -{formatCurrency(filteredExpenses.reduce((sum, e) => {
                const a = Number(e.amount);
                return sum + (isNaN(a) ? 0 : a);
              }, 0))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
