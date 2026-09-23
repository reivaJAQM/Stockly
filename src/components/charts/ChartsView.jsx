import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
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
  const { data, formatCurrency, showToast } = useApp();
  const [timeRange, setTimeRange] = useState('30days');

  // Key Financial Metrics
  const totalSales = Number(data.kpis?.totalSales || 0);
  const totalExpenses = (data.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
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
  const expenseByCategory = useMemo(() => {
    return (data.expenses || []).reduce((acc, curr) => {
      const cat = curr.category || 'Varios';
      acc[cat] = (acc[cat] || 0) + (Number(curr.amount) || 0);
      return acc;
    }, {});
  }, [data.expenses]);

  const expenseCategories = Object.entries(expenseByCategory);

  // Monthly Sales vs Expenses Comparison Data (Last 6 Months)
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
        if (o.date && o.date.startsWith(yearMonth)) {
          mSales += Number(o.total || 0);
        }
      });

      // Sum expenses for this month
      let mExpenses = 0;
      (data.expenses || []).forEach((e) => {
        if (e.date && e.date.startsWith(yearMonth)) {
          mExpenses += Number(e.amount || 0);
        }
      });

      // If it's the current month and data.kpis has sales, ensure current month is populated
      if (i === 0 && mSales === 0 && totalSales > 0) {
        mSales = totalSales;
      }
      if (i === 0 && mExpenses === 0 && totalExpenses > 0) {
        mExpenses = totalExpenses;
      }

      months.push({
        label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        sales: mSales,
        expenses: mExpenses
      });
    }

    return months;
  }, [data.orders, data.expenses, totalSales, totalExpenses]);

  const maxMonthVal = Math.max(
    10,
    ...monthlyComparison.map((m) => Math.max(m.sales, m.expenses))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              Gráficos y Estadísticas
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/60">
              Analítica en vivo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Métricas visuales de ventas, ingresos, gastos, métodos de cobro y rentabilidad.
          </p>
        </div>

        {/* Stockly Signature Segmented Date Filter */}
        <div className="self-start sm:self-auto bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-1">
          {[
            { id: 'today', label: 'Hoy' },
            { id: 'thisWeek', label: 'Esta semana' },
            { id: 'thisMonth', label: 'Este mes' },
            { id: 'thisYear', label: 'Este año' }
          ].map((opt) => {
            const isSelected = (timeRange || 'today') === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setTimeRange(opt.id)}
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
        </div>
      </div>

      {/* Row 1: KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Ingresos Totales</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(totalSales)}
            </h4>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              {(data.orders || []).length} ventas procesadas
            </span>
          </div>
        </div>

        {/* Gastos */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Gastos Totales</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl lg:text-3xl font-extrabold text-rose-600 tracking-tight">
              {formatCurrency(totalExpenses)}
            </h4>
            <span className="text-[11px] text-slate-400 font-medium mt-1 block">
              {(data.expenses || []).length} egresos en caja
            </span>
          </div>
        </div>

        {/* Utilidad Neta */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Utilidad Neta (P&L)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h4 className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${netProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
              {formatCurrency(netProfit)}
            </h4>
            <span className="text-[11px] text-slate-500 font-medium mt-1 block">
              Ingresos − Gastos
            </span>
          </div>
        </div>

        {/* Margen */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Margen Operativo</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              {netMargin}%
            </h4>
            <span className="text-[11px] text-purple-600 font-semibold mt-1 block">
              Rentabilidad neta comercial
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Gráfico de Ingresos por Ventas + Gráfico de Métodos de Pago */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 xl:col-span-8 h-full">
          <SalesChart />
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
