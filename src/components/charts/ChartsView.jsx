import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../dashboard/StatCard';
import { SalesChart } from '../dashboard/SalesChart';
import { ChannelDonut } from '../dashboard/ChannelDonut';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Calendar,
  BarChart3,
  PieChart,
  Boxes,
  PackageCheck,
  Download,
  ArrowUpRight,
  Wallet,
  ShoppingBag,
  Package
} from 'lucide-react';

export const ChartsView = () => {
  const { data, formatCurrency } = useApp();
  const [timeRange, setTimeRange] = useState('today');

  const timeOptions = [
    { id: 'today', label: 'Hoy' },
    { id: 'thisWeek', label: 'Esta semana' },
    { id: 'thisMonth', label: 'Este mes' },
    { id: 'thisYear', label: 'Este año' },
    { id: 'all', label: 'Todo' }
  ];

  // Helper to parse and compare dates accurately
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

    return true;
  };

  // Orders and expenses filtered dynamically by the selected period
  const periodOrders = useMemo(() => {
    return (data.orders || []).filter((o) => {
      if (o.status === 'Cancelado') return false;
      return isDateInSelectedRange(o.createdAt || o.date, timeRange);
    });
  }, [data.orders, timeRange]);

  const periodExpenses = useMemo(() => {
    return (data.expenses || []).filter((e) => {
      return isDateInSelectedRange(e.date || e.createdAt, timeRange);
    });
  }, [data.expenses, timeRange]);

  // Key Financial Metrics matching the selected period
  const totalSales = useMemo(() => {
    if (timeRange === 'all' && periodOrders.length === 0 && Number(data.kpis?.totalSales || 0) > 0) {
      return Number(data.kpis.totalSales);
    }
    return periodOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [periodOrders, timeRange, data.kpis?.totalSales]);

  const totalExpenses = useMemo(() => {
    return periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [periodExpenses]);

  const netProfit = totalSales - totalExpenses;
  const netMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0;

  // Inventory Metrics
  const totalInventoryCost = (data.products || []).reduce(
    (sum, p) => sum + (Number(p.stock) || 0) * (Number(p.costPrice) || 0),
    0
  );
  const totalInventoryRetail = (data.products || []).reduce(
    (sum, p) => sum + (Number(p.stock) || 0) * (Number(p.sellPrice) || 0),
    0
  );
  const potentialProfit = totalInventoryRetail - totalInventoryCost;
  const totalUnitsInStock = (data.products || []).reduce(
    (sum, p) => sum + (Number(p.stock) || 0),
    0
  );

  // Top selling products for graphical bar comparison
  const topSellingProducts = useMemo(() => {
    return [...(data.products || [])]
      .filter((p) => Number(p.unitsSold || 0) > 0)
      .sort((a, b) => (b.unitsSold || 0) - (a.unitsSold || 0))
      .slice(0, 5);
  }, [data.products]);

  const maxUnitsSold = Math.max(
    1,
    ...topSellingProducts.map((p) => Number(p.unitsSold || 0))
  );

  // Group expenses by category
  const activeExpensesForCategory = periodExpenses.length > 0 ? periodExpenses : (data.expenses || []);
  const expenseByCategory = useMemo(() => {
    return activeExpensesForCategory.reduce((acc, curr) => {
      const cat = curr.category || 'General';
      acc[cat] = (acc[cat] || 0) + (Number(curr.amount) || 0);
      return acc;
    }, {});
  }, [activeExpensesForCategory]);

  const expenseCategories = Object.entries(expenseByCategory);

  // Monthly Sales vs Expenses Comparison Data (Last 6 Months) with proper date parsing
  const monthlyComparison = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString('es-ES', { month: 'short' });
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      // Sum sales for this month
      let mSales = 0;
      (data.orders || []).forEach((o) => {
        if (o.status === 'Cancelado') return;
        const rawD = o.createdAt || o.date;
        if (!rawD) return;
        const dOrder = new Date(rawD);
        if (isNaN(dOrder.getTime())) return;
        const oYearMonth = `${dOrder.getFullYear()}-${String(dOrder.getMonth() + 1).padStart(2, '0')}`;
        if (oYearMonth === yearMonth) {
          mSales += Number(o.total || 0);
        }
      });

      // Sum expenses for this month
      let mExpenses = 0;
      (data.expenses || []).forEach((e) => {
        const rawD = e.date || e.createdAt;
        if (!rawD) return;
        const dExp = new Date(rawD);
        if (isNaN(dExp.getTime())) return;
        const eYearMonth = `${dExp.getFullYear()}-${String(dExp.getMonth() + 1).padStart(2, '0')}`;
        if (eYearMonth === yearMonth) {
          mExpenses += Number(e.amount || 0);
        }
      });

      // If current month and data.kpis has sales, ensure current month has at least that
      if (i === 0 && mSales === 0 && Number(data.kpis?.totalSales || 0) > 0) {
        mSales = Number(data.kpis.totalSales);
      }

      months.push({
        label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        sales: mSales,
        expenses: mExpenses
      });
    }

    return months;
  }, [data.orders, data.expenses, data.kpis?.totalSales]);

  const maxMonthVal = Math.max(
    10,
    ...monthlyComparison.map((m) => Math.max(m.sales, m.expenses))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Gráficos y Estadísticas
          </h1>
        </div>

        {/* Stockly Signature Segmented Date Filter */}
        <div className="self-start sm:self-auto bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-1 overflow-x-auto">
          {timeOptions.map((opt) => {
            const isSelected = timeRange === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setTimeRange(opt.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 select-none cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 active:scale-95'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 active:scale-98'
                }`}
              >
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 1: KPI Overview Cards - Identical to other modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(totalSales)}
          icon={DollarSign}
          iconBg="bg-blue-50 border-blue-100 text-blue-600"
        />

        <StatCard
          title="Gastos Totales"
          value={formatCurrency(totalExpenses)}
          icon={TrendingDown}
          iconBg="bg-rose-50 border-rose-100 text-rose-600"
        />

        <StatCard
          title="Utilidad Neta"
          value={formatCurrency(netProfit)}
          icon={Wallet}
          iconBg={netProfit >= 0 ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"}
        />

        <StatCard
          title="Margen Operativo"
          value={`${netMargin}%`}
          icon={Percent}
          iconBg="bg-purple-50 border-purple-100 text-purple-600"
        />
      </div>

      {/* Row 2: Gráfico de Ingresos por Ventas + Gráfico de Métodos de Pago */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 xl:col-span-8 h-full">
          <SalesChart timeRange={timeRange} totalSales={totalSales} />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 h-full">
          <ChannelDonut />
        </div>
      </div>

      {/* Row 3: Comparativa Ventas vs Gastos + Desglose de Gastos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Gráfico Comparativo de Barras: Ventas vs Gastos */}
        <div className="lg:col-span-7 xl:col-span-7 bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Comparativa de Ventas vs Gastos
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">Evolución mensual de flujo monetario</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  Ventas
                </span>
                <span className="flex items-center gap-1.5 text-rose-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  Gastos
                </span>
              </div>
            </div>

            {/* Bars */}
            <div className="mt-6 space-y-4">
              {monthlyComparison.map((m, idx) => {
                const salesPct = maxMonthVal > 0 ? Math.min(100, (m.sales / maxMonthVal) * 100) : 0;
                const expPct = maxMonthVal > 0 ? Math.min(100, (m.expenses / maxMonthVal) * 100) : 0;

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{m.label}</span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-blue-600 font-bold">{formatCurrency(m.sales)}</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-rose-500 font-bold">{formatCurrency(m.expenses)}</span>
                      </div>
                    </div>
                    {/* Double progress bars */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(salesPct, m.sales > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(expPct, m.expenses > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Balance neto acumulado: <strong className="text-slate-800">{formatCurrency(netProfit)}</strong></span>
            <span className="font-semibold text-blue-600">Stockly Analytics</span>
          </div>
        </div>

        {/* Gráfico de Distribución de Gastos por Categoría */}
        <div className="lg:col-span-5 xl:col-span-5 bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Distribución de Gastos
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">Desglose por categoría</p>
              </div>
              <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl">
                {formatCurrency(totalExpenses)}
              </span>
            </div>

            {expenseCategories.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <Wallet className="w-8 h-8 text-slate-300" />
                <p className="font-semibold text-slate-600">Sin gastos registrados</p>
                <p className="text-[11px]">Los gastos que registres se desglosarán aquí por categoría.</p>
              </div>
            ) : (
              <div className="space-y-3.5 mt-2">
                {expenseCategories.map(([cat, amount]) => {
                  const pct = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0;
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          {cat}
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatCurrency(amount)}{' '}
                          <span className="text-slate-400 font-normal text-[11px]">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Control de costos operativos</span>
            <span className="font-semibold text-slate-600">Egresos</span>
          </div>
        </div>
      </div>

      {/* Row 4: Ranking Gráfico de Productos Más Vendidos + Valoración de Inventario */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Gráfico de Barras de Productos Más Vendidos */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between min-h-[340px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Productos Más Vendidos (Mayor Rotación)
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">Ranking por unidades vendidas e ingresos generados</p>
              </div>
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>

            {topSellingProducts.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <ShoppingBag className="w-8 h-8 text-slate-300" />
                <p className="font-semibold text-slate-600">Sin ventas registradas aún</p>
                <p className="text-[11px]">Los productos vendidos se ordenarán aquí en ranking automático.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {topSellingProducts.map((p, idx) => {
                  const pct = Math.round(((p.unitsSold || 0) / maxUnitsSold) * 100);
                  return (
                    <div key={p.id} className="p-2.5 rounded-2xl hover:bg-slate-50 transition-colors border border-slate-100/60 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center flex-shrink-0 ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-800'
                                : idx === 1
                                ? 'bg-slate-200 text-slate-700'
                                : idx === 2
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            #{idx + 1}
                          </span>

                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/60 p-0.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <h5 className="font-bold text-slate-900 text-xs truncate max-w-[170px]" title={p.name}>
                              {p.name}
                            </h5>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {p.category || 'General'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-extrabold text-blue-600 block">
                            {p.unitsSold} {Number(p.unitsSold) === 1 ? 'unidad' : 'unidades'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600">
                            {formatCurrency(p.totalRevenue || p.unitsSold * p.sellPrice)}
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>Rotación y demanda comercial</span>
            <span className="font-semibold text-blue-600">Stockly Ranking</span>
          </div>
        </div>

        {/* Valoración y Rendimiento del Inventario */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between min-h-[320px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Valoración de Capital en Inventario
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">{totalUnitsInStock} unidades en stock actual</p>
              </div>
              <Boxes className="w-4 h-4 text-amber-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-500 font-medium">Inversión (Costo Total):</span>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">{formatCurrency(totalInventoryCost)}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-500 font-medium">Valor Retail (Venta Total):</span>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">{formatCurrency(totalInventoryRetail)}</p>
              </div>

              <div className="sm:col-span-2 p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-emerald-800 font-semibold text-xs">Ganancia Potencial en Bodega:</span>
                  <p className="text-xl font-extrabold text-emerald-700 mt-0.5">
                    +{formatCurrency(potentialProfit)}
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs">
                  {totalInventoryCost > 0 ? `+${((potentialProfit / totalInventoryCost) * 100).toFixed(0)}% ROI` : '100%'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>Retorno de inversión proyectado</span>
            <span className="font-semibold text-emerald-600">Margen Comercial</span>
          </div>
        </div>
      </div>
    </div>
  );
};
