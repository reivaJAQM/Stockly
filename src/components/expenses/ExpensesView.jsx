import React, { useState } from 'react';
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
  PieChart,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export const ExpensesView = () => {
  const {
    data,
    formatCurrency,
    setIsExpenseModalOpen,
    deleteExpense
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const expenses = data.expenses || [];

  const totalSales = Number(data.kpis.totalSales || 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalSales - totalExpenses;
  const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0;

  const categories = ['all', ...new Set(expenses.map((e) => e.category))];

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.concept.toLowerCase().includes(search.toLowerCase()) ||
      (e.supplier && e.supplier.toLowerCase().includes(search.toLowerCase())) ||
      (e.notes && e.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Control de Gastos y Egresos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Registra tus costos fijos, variables y pagos a proveedores para conocer tu beneficio real.
          </p>
        </div>

        <button
          onClick={() => setIsExpenseModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold rounded-2xl shadow-md shadow-rose-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Gasto</span>
        </button>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Gastos"
          value={formatCurrency(totalExpenses)}
          icon={TrendingDown}
          iconBg="bg-rose-50 border-rose-100 text-rose-600"
        />

        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(totalSales)}
          icon={DollarSign}
          iconBg="bg-blue-50 border-blue-100 text-blue-600"
        />

        <StatCard
          title="Utilidad Neta"
          value={formatCurrency(netProfit)}
          icon={Wallet}
          iconBg={netProfit >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por concepto, proveedor o notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
          />
        </div>

        <CustomSelect
          value={selectedCategory}
          onChange={setSelectedCategory}
          options={categories.map((c) => ({
            value: c,
            label: c === 'all' ? 'Todas las categorías' : c
          }))}
        />
      </div>

      {/* Expenses Table - Stockly Dashboard Style */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm">
        <div className="overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <div className="py-14 text-center text-slate-400 space-y-2">
              <Receipt className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">No se encontraron gastos</p>
              <p className="text-xs text-slate-400">Usa el botón "Registrar Gasto" para agregar tu primer egreso.</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100/90 pb-3">
                  <th className="pb-3 px-3 text-left font-semibold">Concepto / Gasto</th>
                  <th className="pb-3 px-3 text-center font-semibold">Categoría</th>
                  <th className="pb-3 px-3 text-center font-semibold">Fecha</th>
                  <th className="pb-3 px-3 text-center font-semibold">Proveedor</th>
                  <th className="pb-3 px-3 text-center font-semibold">Método</th>
                  <th className="pb-3 px-3 text-center font-semibold">Monto</th>
                  <th className="pb-3 px-3 text-center font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/90 transition-colors group">
                    <td className="py-3.5 px-3 text-left">
                      <p className="font-bold text-slate-800 text-xs">{expense.concept}</p>
                      {expense.notes && (
                        <span className="text-[10px] text-slate-400">{expense.notes}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full text-[10px] font-bold">
                        {expense.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center text-slate-500 text-[11px] whitespace-nowrap">
                      {expense.date}
                    </td>

                    <td className="py-3.5 px-3 text-center text-slate-700 text-xs">
                      {expense.supplier || 'N/A'}
                    </td>

                    <td className="py-3.5 px-3 text-center text-slate-600 text-xs whitespace-nowrap">
                      {expense.paymentMethod}
                    </td>

                    <td className="py-3.5 px-3 text-center font-extrabold text-rose-600 text-xs tabular-nums whitespace-nowrap">
                      -{formatCurrency(expense.amount)}
                    </td>

                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Eliminar gasto "${expense.concept}"?`)) {
                            deleteExpense(expense.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredExpenses.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 font-medium">
              Mostrando {filteredExpenses.length} {filteredExpenses.length === 1 ? 'gasto' : 'gastos'}
            </span>
            <span className="text-[11px] font-bold text-slate-600">
              Total: -{formatCurrency(filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
