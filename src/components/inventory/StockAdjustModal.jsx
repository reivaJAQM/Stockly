import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ArrowDownCircle, ArrowUpCircle, RefreshCw, Zap } from 'lucide-react';

export const StockAdjustModal = ({ isOpen, onClose, product }) => {
  const { adjustStock } = useApp();
  const [type, setType] = useState('add'); // 'add', 'remove', 'set'
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Compra de reposición a proveedor');

  if (!isOpen || !product) return null;

  const currentStock = Number(product.stock || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) return;

    if (type === 'add') {
      adjustStock(product.id, qty, reason);
    } else if (type === 'remove') {
      adjustStock(product.id, -qty, reason);
    } else if (type === 'set') {
      const diff = qty - currentStock;
      adjustStock(product.id, diff, `Corrección de inventario (${reason})`);
    }

    onClose();
  };

  const presetQuantities = [1, 5, 10, 20, 50, 100];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img
              src={product.image}
              alt={product.name}
              className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-2xs"
            />
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                Ajustar Existencias
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[220px]">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Stock Banner */}
        <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Stock actual en bodega:</span>
          <span className={`text-sm font-black px-3 py-1 rounded-full ${
            currentStock <= (Number(product.minStock) || 5) ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}>
            {currentStock} unidades
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Operation Type Switcher */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setType('add');
                setReason('Compra de reposición a proveedor');
              }}
              className={`p-3 rounded-2xl font-bold border flex flex-col items-center gap-1.5 transition-all ${
                type === 'add'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
              <span>Entrada (+)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('remove');
                setReason('Salida por merma o daño');
              }}
              className={`p-3 rounded-2xl font-bold border flex flex-col items-center gap-1.5 transition-all ${
                type === 'remove'
                  ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowDownCircle className="w-5 h-5 text-rose-600" />
              <span>Salida (-)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('set');
                setReason('Conteo físico de inventario');
              }}
              className={`p-3 rounded-2xl font-bold border flex flex-col items-center gap-1.5 transition-all ${
                type === 'set'
                  ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <span>Fijar total</span>
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>{type === 'set' ? 'Nuevo Total en Bodega:' : 'Cantidad de Unidades:'}</span>
              <span className="text-[11px] text-slate-400 font-normal">Acceso rápido:</span>
            </label>
            
            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
              {presetQuantities.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuantity(preset.toString())}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                    quantity === preset.toString()
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>

            <input
              type="number"
              min="1"
              required
              autoFocus
              placeholder="Escribe la cantidad (ej. 20)..."
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-black text-base"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Motivo o Justificación</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white font-medium"
            >
              <option value="Compra de reposición a proveedor">Compra de reposición a proveedor</option>
              <option value="Devolución de cliente">Devolución de cliente</option>
              <option value="Ajuste por merma / daño">Ajuste por merma / daño</option>
              <option value="Muestra o promoción comercial">Muestra o promoción comercial</option>
              <option value="Conteo físico de inventario">Conteo físico de inventario</option>
            </select>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              Aplicar Ajuste
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
