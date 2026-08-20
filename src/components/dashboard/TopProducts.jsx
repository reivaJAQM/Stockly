import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingBag, Plus, TrendingUp, Package } from 'lucide-react';

export const TopProducts = () => {
  const { data, formatCurrency, setActiveTab, setIsPOSOpen } = useApp();

  // Only include products that actually have at least 1 unit sold
  const topProducts = [...(data.products || [])]
    .filter((p) => Number(p.unitsSold || 0) > 0)
    .sort((a, b) => (b.unitsSold || 0) - (a.unitsSold || 0))
    .slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between h-full min-h-[380px]">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">Productos más vendidos</h4>
            <p className="text-[11px] text-slate-400 font-medium">Ranking por unidades e ingresos</p>
          </div>
          {topProducts.length > 0 && (
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl">
              Top {topProducts.length}
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center">
          {topProducts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center my-auto">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 text-slate-400 shadow-2xs">
                <ShoppingBag className="w-6 h-6 stroke-[1.75]" />
              </div>
              <p className="font-extrabold text-sm text-slate-700 mb-1">Sin ventas registradas aún</p>
              <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">
                Tus productos más vendidos y su recaudación aparecerán aquí automáticamente al registrar ventas.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((prod, index) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between gap-3 group cursor-pointer hover:bg-slate-50/90 p-2 rounded-2xl transition-all border border-transparent hover:border-slate-100"
                  onClick={() => setActiveTab('inventory')}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center flex-shrink-0 ${
                      index === 0
                        ? 'bg-amber-100 text-amber-800'
                        : index === 1
                        ? 'bg-slate-200 text-slate-700'
                        : index === 2
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      #{index + 1}
                    </span>

                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-300" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors" title={prod.name}>
                        {prod.name}
                      </h5>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {prod.unitsSold} {Number(prod.unitsSold) === 1 ? 'unidad vendida' : 'unidades vendidas'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-extrabold text-slate-900 block">
                      {formatCurrency(prod.totalRevenue || (prod.unitsSold * prod.sellPrice))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {topProducts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <button
            onClick={() => setActiveTab('inventory')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
          >
            <span>Ver inventario completo</span>
          </button>
        </div>
      )}
    </div>
  );
};
