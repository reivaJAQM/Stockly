import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomSelect } from '../common/CustomSelect';
import { StatCard } from '../dashboard/StatCard';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Boxes,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Truck
} from 'lucide-react';

export const InventoryView = () => {
  const {
    data,
    formatCurrency,
    setIsProductModalOpen,
    setEditingProduct,
    deleteProduct,
    openRestockModal
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out, healthy

  // Calculations for valuation cards
  const totalProducts = (data.products || []).length;
  const totalStockUnits = (data.products || []).reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalInventoryCost = (data.products || []).reduce(
    (sum, p) => sum + (Number(p.stock) || 0) * (Number(p.costPrice) || 0),
    0
  );
  const totalInventoryRetail = (data.products || []).reduce(
    (sum, p) => sum + (Number(p.stock) || 0) * (Number(p.sellPrice) || 0),
    0
  );
  const lowStockCount = (data.products || []).filter(
    (p) => (Number(p.stock) || 0) <= (Number(p.minStock) || 5)
  ).length;

  const productCategories = [
    'all',
    ...Array.from(new Set((data.products || []).map((p) => p.category).filter(Boolean)))
  ];

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

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Inventario
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Administra tus existencias de almacén, costos, precios y entradas de mercancía.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => openRestockModal(null)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold rounded-2xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            title="Ingreso de compra o reposición de stock masivo"
          >
            <Truck className="w-4 h-4" />
            <span>Entrada de Mercancía</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-extrabold rounded-2xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Valuation Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Productos"
          value={totalProducts}
          icon={Boxes}
          iconBg="bg-blue-50 border-blue-100 text-blue-600"
        />

        <StatCard
          title="Valor en Costo"
          value={formatCurrency(totalInventoryCost)}
          icon={TrendingUp}
          iconBg="bg-emerald-50 border-emerald-100 text-emerald-600"
          valueColor="text-emerald-600"
        />

        <StatCard
          title="Valor en Venta"
          value={formatCurrency(totalInventoryRetail)}
          icon={DollarSign}
          iconBg="bg-violet-50 border-violet-100 text-violet-600"
          valueColor="text-violet-600"
        />

        <StatCard
          title="Stock Crítico / Bajo"
          value={lowStockCount}
          icon={AlertTriangle}
          iconBg="bg-amber-50 border-amber-100 text-amber-600"
          valueColor="text-amber-600"
        />
      </div>

      {/* Search, Filter & Count Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar producto por nombre..."
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

      {/* Products Table - Clean, Reorganized 5 Columns */}
      <div className="bg-white rounded-3xl border border-slate-100/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6 text-left w-4/12">Producto</th>
                <th className="py-4 px-4 text-center w-2/12">P. Costo</th>
                <th className="py-4 px-4 text-center w-2/12">P. Venta</th>
                <th className="py-4 px-4 text-center w-2/12 whitespace-nowrap">Stock Actual</th>
                <th className="py-4 px-6 text-center w-2/12">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-14 text-center text-slate-400 text-xs">
                    <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2" />
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

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Product Name & Thumbnail Only */}
                      <td className="py-4 px-6 text-left">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
                            {product.image ? (
                              <img src={product.image} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <Boxes className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight line-clamp-2">
                            {product.name}
                          </span>
                        </div>
                      </td>

                      {/* Cost Price */}
                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-bold text-slate-500 tabular-nums">
                          {formatCurrency(cost)}
                        </span>
                      </td>

                      {/* Sell Price */}
                      <td className="py-4 px-4 text-center">
                        <span className="text-xs font-black text-slate-900 tabular-nums">
                          {formatCurrency(sell)}
                        </span>
                      </td>

                      {/* Stock Status Badge */}
                      {/* Stock Status Badge - Single Line, No Dot */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold whitespace-nowrap ${
                              isOut
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isLow
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {stockNum} {stockNum === 1 ? 'unidad' : 'unidades'}
                          </span>
                        </div>
                      </td>

                      {/* Actions: Reabastecer, Editar, Eliminar */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openRestockModal(product)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 text-xs font-extrabold rounded-xl border border-emerald-200/80 transition-all cursor-pointer shadow-2xs"
                            title="Reabastecer stock de este producto"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Reabastecer</span>
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
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
