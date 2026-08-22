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
  TrendingUp
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

  // Calculations for valuation cards
  const totalProducts = (data.products || []).length;
  const totalStockUnits = (data.products || []).reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalInventoryCost = (data.products || []).reduce((sum, p) => sum + (Number(p.stock) || 0) * (Number(p.costPrice) || 0), 0);
  const totalInventoryRetail = (data.products || []).reduce((sum, p) => sum + (Number(p.stock) || 0) * (Number(p.sellPrice) || 0), 0);
  const lowStockCount = (data.products || []).filter((p) => (Number(p.stock) || 0) <= (Number(p.minStock) || 5)).length;

  const categories = ['all', ...Array.from(new Set((data.products || []).map((p) => p.category).filter(Boolean)))];

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

  const handleEdit = (product) => {
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
            Inventario y Catálogo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Gestiona tus existencias de bodega, niveles de stock, precios y costos.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
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
            <span className="text-[11px] font-semibold text-slate-400">Total Unidades en Stock</span>
            <h4 className="text-xl font-extrabold text-slate-900">{totalStockUnits.toLocaleString()} u.</h4>
            <span className="text-[10px] text-slate-500 font-medium">{totalProducts} artículos en catálogo</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400">Alertas de Stock Bajo</span>
            <h4 className="text-xl font-extrabold text-rose-600">{lowStockCount} artículos</h4>
            <span className="text-[10px] text-rose-400 font-medium">Requieren reposición</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400">Inversión a Costo</span>
            <h4 className="text-xl font-extrabold text-slate-900">{formatCurrency(totalInventoryCost)}</h4>
            <span className="text-[10px] text-slate-500 font-medium">Capital inmovilizado</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400">Expectativa Retail</span>
            <h4 className="text-xl font-extrabold text-emerald-600">{formatCurrency(totalInventoryRetail)}</h4>
            <span className="text-[10px] text-emerald-600 font-medium">Venta estimada total</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
          <CustomSelect
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[
              { value: 'all', label: 'Todas las categorías' },
              ...categories.filter((c) => c !== 'all').map((c) => ({ value: c, label: c }))
            ]}
          />

          <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                stockFilter === 'all' ? 'bg-white text-slate-800 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                stockFilter === 'low' ? 'bg-rose-500 text-white shadow-xs font-bold' : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              Stock Bajo ({lowStockCount})
            </button>
            <button
              onClick={() => setStockFilter('healthy')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                stockFilter === 'healthy' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-500 hover:text-emerald-600'
              }`}
            >
              Óptimo
            </button>
          </div>
        </div>
      </div>

      {/* Products Catalog Table */}
      <div className="bg-white rounded-3xl border border-slate-100/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Producto</th>
                <th className="py-3.5 px-4">SKU / Barcode</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Costo</th>
                <th className="py-3.5 px-4">Precio Venta</th>
                <th className="py-3.5 px-4 text-center">Ajuste de Stock</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 text-xs">
                    <Boxes className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No se encontraron productos en el inventario.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockNum = Number(product.stock || 0);
                  const minStockNum = Number(product.minStock || 5);
                  const isLow = stockNum <= minStockNum;
                  const isOut = stockNum === 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200/80 bg-slate-50 flex-shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{product.name}</p>
                            <span className="text-[10px] text-slate-400 font-medium">{product.unitsSold || 0} vendidos en total</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-700">{product.sku || 'N/A'}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{product.barcode}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg">
                          {product.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {formatCurrency(product.costPrice)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(product.sellPrice)}
                      </td>

                      {/* Interactive In-Line Stock Adjuster */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50/90 p-1 rounded-2xl border border-slate-200 shadow-2xs">
                          {/* Quick -1 Button */}
                          <button
                            type="button"
                            onClick={(e) => handleQuickSubtract(e, product, 1)}
                            disabled={stockNum <= 0}
                            className="w-7 h-7 rounded-xl bg-white hover:bg-rose-500 hover:text-white text-slate-700 font-black flex items-center justify-center transition-all active:scale-90 border border-slate-200/80 disabled:opacity-30 disabled:pointer-events-none shadow-2xs"
                            title="Restar 1 unidad (-1)"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          {/* Central Stock Display with modal opener */}
                          <button
                            type="button"
                            onClick={() => handleAdjust(product)}
                            className={`min-w-[54px] px-2 py-0.5 rounded-xl font-black text-xs transition-all hover:ring-2 hover:ring-blue-500/25 ${
                              isLow
                                ? 'text-rose-600 bg-rose-50/80'
                                : 'text-slate-900 bg-white'
                            }`}
                            title="Clic para ajustar cantidad exacta o en lote"
                          >
                            {stockNum} u.
                          </button>

                          {/* Quick +1 Button */}
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(e, product, 1)}
                            className="w-7 h-7 rounded-xl bg-white hover:bg-emerald-600 hover:text-white text-slate-700 font-black flex items-center justify-center transition-all active:scale-90 border border-slate-200/80 shadow-2xs"
                            title="Sumar 1 unidad (+1)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-medium mt-1">mín: {minStockNum}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isOut ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            Agotado
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                            Stock Bajo
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Óptimo
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAdjust(product)}
                            className="p-2 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-xl transition-colors"
                            title="Ajuste avanzado (Entrada/Salida por lote)"
                          >
                            <Boxes className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl transition-colors"
                            title="Editar datos del producto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
                                deleteProduct(product.id);
                              }
                            }}
                            className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"
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
