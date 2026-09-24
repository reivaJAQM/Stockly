import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../dashboard/StatCard';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  FileSpreadsheet,
  PieChart,
  Boxes,
  Percent,
  ArrowUpRight,
  Receipt,
  Calendar,
  Wallet,
  Building2,
  PackageCheck
} from 'lucide-react';

export const ReportsView = () => {
  const { data, formatCurrency, showToast } = useApp();

  const totalSales = Number(data.kpis?.totalSales || 0);
  const totalExpenses = (data.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = totalSales - totalExpenses;
  const netMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0;

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

  // Group expenses by category
  const expenseByCategory = (data.expenses || []).reduce((acc, curr) => {
    const cat = curr.category || 'Varios';
    acc[cat] = (acc[cat] || 0) + (Number(curr.amount) || 0);
    return acc;
  }, {});

  const expenseCategories = Object.entries(expenseByCategory);

  // Export data as CSV
  const exportSalesCSV = () => {
    try {
      const headers = "ID,Cliente,Fecha,Canal,Metodo,Total,Estado\n";
      const rows = (data.orders || [])
        .map(
          (o) =>
            `"${o.id}","${o.customer?.name || 'Consumidor Final'}","${o.date}","${o.channel || 'Físico'}","${o.paymentMethod || 'Efectivo'}",${Number(o.total || 0).toFixed(2)},"${o.status}"`
        )
        .join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `stockly_ventas_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast?.({
        type: 'success',
        title: 'Reporte Exportado',
        message: 'Archivo de ventas descargado correctamente en formato CSV.'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const exportInventoryCSV = () => {
    try {
      const headers = "SKU,Producto,Categoria,Costo,PrecioVenta,Stock,MinStock,GananciaPotencial\n";
      const rows = (data.products || [])
        .map(
          (p) => {
            const cost = Number(p.costPrice || 0);
            const price = Number(p.sellPrice || 0);
            const stock = Number(p.stock || 0);
            const potential = (price - cost) * stock;
            return `"${p.sku || ''}","${p.name}","${p.category || 'General'}",${cost.toFixed(2)},${price.toFixed(2)},${stock},${p.minStock || 0},${potential.toFixed(2)}`;
          }
        )
        .join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `stockly_inventario_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast?.({
        type: 'success',
        title: 'Reporte Exportado',
        message: 'Archivo de inventario descargado correctamente en formato CSV.'
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Reportes y Analíticas Financieras
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={exportSalesCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-2xl shadow-xs transition-colors active:scale-95"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Exportar Ventas CSV</span>
          </button>
          <button
            onClick={exportInventoryCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Inventario CSV</span>
          </button>
        </div>
      </div>

      {/* P&L Key Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(totalSales)}
          icon={TrendingUp}
          iconBg="bg-emerald-50 border-emerald-100 text-emerald-600"
        />

        <StatCard
          title="Gastos Totales"
          value={formatCurrency(totalExpenses)}
          icon={TrendingDown}
          iconBg="bg-rose-50 border-rose-100 text-rose-600"
        />

        <StatCard
          title="Utilidad Neta (P&L)"
          value={formatCurrency(netProfit)}
          icon={DollarSign}
          iconBg={netProfit >= 0 ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-rose-50 border-rose-100 text-rose-600"}
        />

        <StatCard
          title="Margen Operativo"
          value={`${netMargin}%`}
          icon={Percent}
          iconBg="bg-purple-50 border-purple-100 text-purple-600"
        />
      </div>

      {/* Visual Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Expenses Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900">Distribución de Gastos por Categoría</h4>
              <span className="text-xs text-slate-400 font-medium">Total: {formatCurrency(totalExpenses)}</span>
            </div>

            {expenseCategories.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <Wallet className="w-8 h-8 text-slate-300" />
                <p>No hay gastos registrados en el periodo.</p>
                <p className="text-[11px] text-slate-400">Los gastos que registres se desglosarán aquí automáticamente.</p>
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                {expenseCategories.map(([cat, amount]) => {
                  const pct = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0;
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          {cat}
                        </span>
                        <span>{formatCurrency(amount)} ({pct}%)</span>
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

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>Control de flujo de caja</span>
            <span className="font-semibold text-slate-600">Stockly P&L</span>
          </div>
        </div>

        {/* Valuation & Capital Allocation */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900">Valoración y Capital en Inventario</h4>
              <span className="text-xs text-slate-400 font-medium">{totalUnitsInStock} unidades en stock</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-medium">Inversión Total en Inventario (Costo):</span>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">{formatCurrency(totalInventoryCost)}</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-medium">Expectativa de Venta Total (Retail):</span>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">{formatCurrency(totalInventoryRetail)}</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <PackageCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-emerald-800 font-semibold">Ganancia Bruta Potencial en Bodega:</span>
                  <p className="text-xl font-extrabold text-emerald-700 mt-0.5">
                    +{formatCurrency(potentialProfit)}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-[11px]">
                  {totalInventoryCost > 0 ? `+${((potentialProfit / totalInventoryCost) * 100).toFixed(0)}% ROI` : '100%'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>Capital inmovilizado y ROI</span>
            <span className="font-semibold text-slate-600">Margen Comercial</span>
          </div>
        </div>
      </div>
    </div>
  );
};
