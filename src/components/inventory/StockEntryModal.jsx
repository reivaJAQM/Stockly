import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Search,
  Boxes,
  CheckCircle2,
  Truck
} from 'lucide-react';

export const StockEntryModal = ({ isOpen, onClose, initialProduct = null }) => {
  const { data, formatCurrency, batchRestock } = useApp();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize modal with single product if provided
  useEffect(() => {
    if (isOpen) {
      if (initialProduct) {
        setItems([
          {
            productId: initialProduct.id,
            name: initialProduct.name,
            image: initialProduct.image,
            currentStock: Number(initialProduct.stock) || 0,
            quantity: 1,
            costPrice: Number(initialProduct.costPrice) || 0
          }
        ]);
      } else {
        setItems([]);
      }
      setSearch('');
      setIsSearchOpen(false);
      setIsSubmitting(false);
    }
  }, [isOpen, initialProduct]);

  if (!isOpen) return null;

  // Filter products for adding more items to the batch
  const existingProductIds = new Set(items.map((i) => i.productId));
  const searchResults = (data.products || []).filter((p) => {
    if (existingProductIds.has(p.id)) return false;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.includes(q))
    );
  });

  const handleAddProduct = (prod) => {
    setItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        name: prod.name,
        image: prod.image,
        currentStock: Number(prod.stock) || 0,
        quantity: 1,
        costPrice: Number(prod.costPrice) || 0
      }
    ]);
    setSearch('');
    setIsSearchOpen(false);
  };

  const handleUpdateQuantity = (productId, newQty) => {
    const qty = Math.max(1, parseInt(newQty, 10) || 1);
    setItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity: qty } : item))
    );
  };

  const handleStepQuantity = (productId, delta) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const qty = Math.max(1, (parseInt(item.quantity, 10) || 0) + delta);
          return { ...item, quantity: qty };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Calculations
  const totalUnits = items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);
  const totalCost = items.reduce(
    (sum, item) => sum + (parseInt(item.quantity, 10) || 0) * (parseFloat(item.costPrice) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0 || totalUnits <= 0) return;

    try {
      setIsSubmitting(true);
      await batchRestock({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: parseInt(i.quantity, 10),
          costPrice: parseFloat(i.costPrice)
        })),
        reason: 'Entrada de mercancía'
      });
      onClose();
    } catch (err) {
      console.error('Error submitting stock restock:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                Entrada de Mercancía
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Suma existencias y calcula el costo total en tiempo real.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Product Search Bar */}
          <div className="relative">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar producto para agregar..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>

            {/* Dropdown Results */}
            {isSearchOpen && search.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-52 overflow-y-auto divide-y divide-slate-50 p-1 animate-in fade-in">
                {searchResults.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400 font-medium">
                    No se encontraron productos disponibles.
                  </div>
                ) : (
                  searchResults.slice(0, 6).map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleAddProduct(prod)}
                      className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {prod.image ? (
                            <img src={prod.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Boxes className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {prod.name}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            Stock actual: {prod.stock || 0} un.
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Agregar
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Clean List of Products */}
          <div className="space-y-2.5">
            {items.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                <Boxes className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">No hay productos seleccionados</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Usa el buscador para seleccionar los productos que han llegado en esta compra.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const qty = parseInt(item.quantity, 10) || 0;
                const unitCost = parseFloat(item.costPrice) || 0;
                const itemSubtotal = qty * unitCost;

                return (
                  <div
                    key={item.productId}
                    className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 transition-colors hover:border-slate-300"
                  >
                    {/* Product Name & Current Stock */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Boxes className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                          {item.name}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Stock actual: <strong className="text-slate-600">{item.currentStock} un.</strong>
                        </span>
                      </div>
                    </div>

                    {/* Quantity Stepper (comfortable horizontal buttons, NO vertical spinners) */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStepQuantity(item.productId, -1)}
                        disabled={qty <= 1}
                        className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 active:scale-95 transition-all cursor-pointer shadow-2xs"
                        title="Restar 1 unidad"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.productId, e.target.value)}
                        className="w-12 h-8 text-center bg-white border border-slate-200 rounded-xl font-extrabold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleStepQuantity(item.productId, 1)}
                        className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
                        title="Sumar 1 unidad"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Total Cost on the Right (in green) */}
                    <div className="w-24 text-right flex-shrink-0">
                      <span className="text-sm font-black text-emerald-600 tabular-nums">
                        {formatCurrency(itemSubtotal)}
                      </span>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.productId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex-shrink-0"
                      title="Quitar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Clean Footer with Live Totals & Action */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Total ({totalUnits} {totalUnits === 1 ? 'unidad' : 'unidades'}):
            </span>
            <span className="text-xl font-black text-emerald-600 tracking-tight tabular-nums">
              {formatCurrency(totalCost)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={items.length === 0 || totalUnits <= 0 || isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Confirmar Entrada'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
