import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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
        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400">Total Gastos Registrados</span>
            <h4 className="text-xl font-extrabold text-rose-600">{formatCurrency(totalExpenses)}</h4>
            <span className="text-[10px] text-slate-500 font-medium">{expenses.length} egresos reportados</span>
          </div>
        </div>

        {/* Total Revenues */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400">Ingresos Totales (Ventas)</span>
            <h4 className="text-xl font-extrabold text-slate-900">{formatCurrency(totalSales)}</h4>
            <span className="text-[10px] text-emerald-600 font-medium">Facturación acumulada</span>
          </div>
        </div>

        {/* Net Real Profit */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400">Utilidad Neta Real</span>
            <h4 className={`text-xl font-extrabold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(netProfit)}
            </h4>
            <span className="text-[10px] font-bold text-slate-600">
              {profitMargin}% de margen sobre ventas
            </span>
          </div>
        </div>
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

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Concepto / Gasto</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Proveedor / Beneficiario</th>
                <th className="py-3.5 px-4">Método</th>
                <th className="py-3.5 px-4">Monto</th>
                <th className="py-3.5 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-6">
                    <p className="font-bold text-slate-900">{expense.concept}</p>
                    {expense.notes && (
                      <span className="text-[10px] text-slate-400">{expense.notes}</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-[11px] font-semibold">
                      {expense.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500">{expense.date}</td>

                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {expense.supplier || 'N/A'}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600">
                    {expense.paymentMethod}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-rose-600 text-sm">
                    -{formatCurrency(expense.amount)}
                  </td>

                  <td className="py-3.5 px-6 text-right">
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar gasto "${expense.concept}"?`)) {
                          deleteExpense(expense.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Eliminar gasto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredExpenses.length === 0 && (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Receipt className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-semibold text-sm">No se encontraron gastos</p>
              <p className="text-xs">Usa el botón "Registrar Gasto" para agregar tu primer egreso.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
