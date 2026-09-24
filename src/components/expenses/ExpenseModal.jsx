import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomSelect } from '../common/CustomSelect';
import { X, Receipt, Tag } from 'lucide-react';

export const ExpenseModal = ({ isOpen, onClose }) => {
  const { addExpense, expenseCategories = [], addExpenseCategory, data } = useApp();

  const [formData, setFormData] = useState({
    concept: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    notes: ''
  });

  // Only expense-specific categories created by the user (separated from products)
  const categoryOptions = (expenseCategories || []).map((cat) => ({
    value: cat,
    label: cat
  }));

  useEffect(() => {
    if (isOpen) {
      setFormData({
        concept: '',
        category: expenseCategories[0] || '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        supplier: '',
        notes: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddNewCategory = (newCat) => {
    if (!newCat.trim()) return;
    const clean = newCat.trim();
    if (addExpenseCategory) {
      addExpenseCategory(clean);
    }
    setFormData((prev) => ({
      ...prev,
      category: clean
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.concept.trim() || !formData.amount) return;

    addExpense({
      ...formData,
      concept: formData.concept.trim(),
      category: formData.category.trim() || 'General',
      amount: Number(formData.amount),
      paymentMethod: 'Efectivo', // Sin campo de método de pago requerido
      supplier: formData.supplier.trim(),
      notes: formData.notes.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button Top-Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Centered Header */}
        <div className="flex flex-col items-center justify-center text-center pb-4 mb-4 border-b border-slate-100/90">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-2.5 shadow-xs">
            <Receipt className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">
            Registrar Nuevo Gasto
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Prominent Amount Field - Centered Stockly Style */}
          <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100/90 flex flex-col items-center justify-center">
            <label className="text-[11px] font-bold text-rose-600 uppercase tracking-wider mb-1">
              Monto del Gasto *
            </label>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-black text-rose-500">
                {data.storeInfo?.currencySymbol || '$'}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="text-2xl sm:text-3xl font-black text-rose-600 bg-transparent text-center focus:outline-none w-44 placeholder:text-rose-300"
                autoFocus
              />
            </div>
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-center font-bold text-slate-700 mb-1.5">
              Concepto o Descripción *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Pago de luz y agua, Mantenimiento..."
              value={formData.concept}
              onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 font-medium text-center placeholder:text-slate-400 transition-all"
            />
          </div>

          {/* Categoría y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-center font-bold text-slate-700 mb-1.5">
                Categoría
              </label>
              <CustomSelect
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
                options={categoryOptions}
                allowCustom={true}
                onAddNew={handleAddNewCategory}
                placeholder={categoryOptions.length === 0 ? "Crear primera categoría" : "Seleccionar categoría"}
                customPlaceholder="Nombre de nueva categoría..."
                icon={Tag}
                className="w-full"
                buttonClassName="bg-slate-50/90 text-center justify-center"
              />
            </div>

            <div>
              <label className="block text-center font-bold text-slate-700 mb-1.5">
                Fecha
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 font-semibold text-center transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Beneficiario */}
          <div>
            <label className="block text-center font-bold text-slate-700 mb-1.5">
              Beneficiario
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ej. CFE, Juan Pérez, Inmobiliaria..."
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 font-medium text-center placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          {/* Notas adicionales con placeholder centrado */}
          <div>
            <label className="block text-center font-bold text-slate-700 mb-1.5">
              Notas adicionales <span className="font-normal text-slate-400 text-[10px]">(Opcional)</span>
            </label>
            <textarea
              rows="2"
              placeholder="Detalles sobre la factura o motivo del gasto..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 font-medium text-center placeholder:text-slate-400 placeholder:text-center resize-none transition-all"
              style={{ textAlign: 'center' }}
            />
          </div>

          {/* Centered Actions */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200/90 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95 cursor-pointer text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold rounded-2xl shadow-md shadow-rose-500/25 transition-all cursor-pointer text-xs"
            >
              Registrar Gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
