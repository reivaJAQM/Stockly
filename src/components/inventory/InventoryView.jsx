import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomSelect } from '../common/CustomSelect';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  PackageX,
  PlusCircle,
  Minus,
  Tag,
  DollarSign,
  TrendingUp,
  Zap,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';

export const InventoryView = () => {
  const {
    data,
    formatCurrency,
    setIsProductModalOpen,
    setEditingProduct,
    deleteProduct,
    setSelectedStockProduct,
    setIsAdjustStockModalOpen,
    adjustStock
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out, healthy

  // Calculations for product valuation cards
  const totalProducts = (data.products || []).length;
  const totalStockUnits = (data.products || []).reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalInventoryCost = (data.products || []).reduce((sum, p) => sum + (Number(p.stock) || 0) * (Number(p.costPrice) || 0), 0);
  const totalInventoryRetail = (data.products || []).reduce((sum, p) => sum + (Number(p.stock) || 0) * (Number(p.sellPrice) || 0), 0);
  const lowStockCount = (data.products || []).filter((p) => (Number(p.stock) || 0) <= (Number(p.minStock) || 5)).length;

  const productCategories = ['all', ...Array.from(new Set((data.products || []).map((p) => p.category).filter(Boolean)))];

  const filteredProducts = (data.products || []).filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.barcode && p.barcode.includes(search));

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    let matchesStock = true;
    const stockNum = Number(p.stock) || 0;
    const minStockNum = Number(p.minStock) || 5;
    if (stockFilter === 'low') matchesStock = stockNum > 0 && stockNum <= minStockNum;
    if (stockFilter === 'out') matchesStock = stockNum === 0;
    if (stockFilter === 'healthy') matchesStock = stockNum > minStockNum;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleAdjust = (product) => {
    setSelectedStockProduct(product);
    setIsAdjustStockModalOpen(true);
  };

  const handleQuickAdd = async (e, product, amount) => {
    e.stopPropagation();
    try {
      await adjustStock(product.id, amount, `Ajuste rápido (+${amount})`);
    } catch (err) {
      console.error('Error in quick add:', err);
    }
  };

  const handleQuickSubtract = async (e, product, amount) => {
    e.stopPropagation();
    if ((Number(product.stock) || 0) <= 0) return;
    try {
      await adjustStock(product.id, -amount, `Ajuste rápido (-${amount})`);
    } catch (err) {
      console.error('Error in quick subtract:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Inventario
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Administra tus productos físicos de almacén, existencias y costos.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Valuation Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400">Total Productos</span>
            <h4 className="text-xl font-extrabold text-slate-900">{totalProducts}</h4>
            <span className="text-[10px] text-slate-500 font-medium">{totalStockUnits} unidades en stock</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400">Valor en Costo</span>
            <h4 className="text-xl font-extrabold text-emerald-600">{formatCurrency(totalInventoryCost)}</h4>
            <span className="text-[10px] text-slate-400">Inversión actual</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400">Valor en Venta</span>
            <h4 className="text-xl font-extrabold text-violet-600">{formatCurrency(totalInventoryRetail)}</h4>
            <span className="text-[10px] text-slate-400">Retorno esperado</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400">Stock Crítico / Bajo</span>
            <h4 className="text-xl font-extrabold text-amber-600">{lowStockCount}</h4>
            <span className="text-[10px] text-slate-400">Requiere reabastecimiento</span>
          </div>
        </div>
      </div>

      {/* Search, Filter & View Mode Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <CustomSelect
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[
              { value: 'all', label: 'Todas las categorías' },
              ...productCategories.filter((c) => c !== 'all').map((c) => ({ value: c, label: c }))
            ]}
          />

          <CustomSelect
            value={stockFilter}
            onChange={setStockFilter}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'healthy', label: 'Stock saludable' },
              { value: 'low', label: 'Stock bajo' },
              { value: 'out', label: 'Agotados' }
            ]}
          />

          <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100 whitespace-nowrap">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-100/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Producto</th>
                <th className="py-3.5 px-4">SKU / Código</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">P. Costo</th>
                <th className="py-3.5 px-4">P. Venta</th>
                <th className="py-3.5 px-4">Margen</th>
                <th className="py-3.5 px-4 text-center">Stock Actual</th>
                <th className="py-3.5 px-4 text-center">Ajuste Rápido</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 text-xs">
                    <Boxes className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No se encontraron productos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockNum = Number(product.stock) || 0;
                  const minStockNum = Number(product.minStock) || 5;
                  const isLow = stockNum > 0 && stockNum <= minStockNum;
                  const isOut = stockNum === 0;

                  const cost = Number(product.costPrice) || 0;
                  const sell = Number(product.sellPrice) || 0;
                  const margin = sell > 0 ? (((sell - cost) / sell) * 100).toFixed(0) : 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.image ? (
                              <img src={product.image} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <Boxes className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{product.name}</p>
                            <span className="text-[10px] text-slate-400 font-medium">Stock mín: {minStockNum}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {product.sku || 'S/N'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg">
                          {product.category || 'General'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-semibold">
                        {formatCurrency(cost)}
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {formatCurrency(sell)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">
                          +{margin}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isOut
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : isLow
                              ? 'bg-amber-50 text-amber-600 border border-amber-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}
                        >
                          {stockNum} unidades
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-xl p-0.5">
                          <button
                            type="button"
                            onClick={(e) => handleQuickSubtract(e, product, 1)}
                            disabled={stockNum <= 0}
                            className="p-1 hover:bg-white text-slate-500 hover:text-rose-600 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                            title="Restar 1 unidad"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(e, product, 1)}
                            className="p-1 hover:bg-white text-slate-500 hover:text-emerald-600 rounded-lg transition-colors cursor-pointer"
                            title="Sumar 1 unidad"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAdjust(product)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                            title="Ajustar inventario detallado"
                          >
                            Ajustar
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
                            title="Editar producto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
                                deleteProduct(product.id);
                              }
                            }}
                            className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
