import React from 'react';
import { useApp } from '../../context/AppContext';
import { AlertCircle, Plus } from 'lucide-react';

export const LowStockWidget = () => {
  const { data, setActiveTab, setSelectedStockProduct, setIsAdjustStockModalOpen } = useApp();

  const lowStockProducts = (data.products || [])
    .filter((p) => p.stock <= (p.minStock || 10))
    .slice(0, 5);

  const handleQuickRestock = (product, e) => {
    e.stopPropagation();
    setSelectedStockProduct(product);
    setIsAdjustStockModalOpen(true);
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between h-full min-h-[340px]">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-slate-900">Inventario bajo</h4>
          </div>
          <button
            onClick={() => setActiveTab('inventory')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Ver todo
          </button>
        </div>

        <div className="space-y-3.5 flex-1 flex flex-col justify-center">
          {lowStockProducts.map((prod) => (
            <div
              key={prod.id}
              onClick={() => setActiveTab('inventory')}
              className="flex items-center justify-between gap-3 p-1 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200/60 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                    {prod.name}
                  </h5>
                  <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1 mt-0.5">
                    <span>{prod.stock} {prod.stock === 1 ? 'unidad restante' : 'unidades restantes'}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => handleQuickRestock(prod, e)}
                title="Reabastecer stock"
                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors text-xs font-medium flex items-center gap-1 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Reponer</span>
              </button>
            </div>
          ))}

          {lowStockProducts.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400">
              Todo el inventario se encuentra en niveles óptimos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
