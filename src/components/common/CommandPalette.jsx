import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Package,
  ShoppingCart,
  Users,
  Building2,
  Receipt,
  PlusCircle,
  X,
  ArrowRight
} from 'lucide-react';

export const CommandPalette = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    data,
    setActiveTab,
    setIsPOSOpen,
    setIsProductModalOpen,
    setIsExpenseModalOpen,
    setSelectedReceiptOrder
  } = useApp();

  const [query, setQuery] = useState('');

  if (!isCommandPaletteOpen) return null;

  const filteredProducts = (data.products || [])
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(query.toLowerCase())))
    .slice(0, 4);

  const filteredOrders = (data.orders || [])
    .filter((o) => o.id.toLowerCase().includes(query.toLowerCase()) || o.customer?.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3);

  const filteredCustomers = (data.customers || [])
    .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3);

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    setIsCommandPaletteOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-blue-600 ml-1" />
          <input
            type="text"
            autoFocus
            placeholder="Escribe para buscar productos, clientes, ventas o acciones rápidas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Quick Actions */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 block">
              Acciones Rápidas
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setIsCommandPaletteOpen(false);
                  setIsPOSOpen(true);
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 font-semibold transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <span>Nueva Venta</span>
              </button>

              <button
                onClick={() => {
                  setIsCommandPaletteOpen(false);
                  setIsProductModalOpen(true);
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 font-semibold transition-colors"
              >
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Nuevo Producto</span>
              </button>

              <button
                onClick={() => {
                  setIsCommandPaletteOpen(false);
                  setIsExpenseModalOpen(true);
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 text-rose-700 font-semibold transition-colors"
              >
                <Receipt className="w-4 h-4 text-rose-600" />
                <span>Registrar Gasto</span>
              </button>
            </div>
          </div>

          {/* Products */}
          {filteredProducts.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 block">
                Productos ({filteredProducts.length})
              </span>
              <div className="space-y-1">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectTab('inventory')}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-slate-800">{p.name}</p>
                        <span className="text-[10px] text-slate-400">Stock: {p.stock} | SKU: {p.sku}</span>
                      </div>
                    </div>
                    <span className="font-bold text-blue-600">${p.sellPrice}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders */}
          {filteredOrders.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 block">
                Ventas y Órdenes ({filteredOrders.length})
              </span>
              <div className="space-y-1">
                {filteredOrders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => {
                      setIsCommandPaletteOpen(false);
                      setSelectedReceiptOrder(o);
                    }}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShoppingCart className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="font-bold text-slate-800">{o.id} - {o.customer?.name}</p>
                        <span className="text-[10px] text-slate-400">{o.date} | {o.status}</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">${o.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {filteredCustomers.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 block">
                Clientes ({filteredCustomers.length})
              </span>
              <div className="space-y-1">
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectTab('customers')}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="font-bold text-slate-800">{c.name}</p>
                        <span className="text-[10px] text-slate-400">{c.email} | {c.phone}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 px-4">
          <span>Usa <kbd className="px-1.5 py-0.5 bg-white border rounded text-slate-600 font-bold">ESC</kbd> para cerrar</span>
          <span className="font-medium text-slate-500">Stockly Business OS</span>
        </div>
      </div>
    </div>
  );
};
