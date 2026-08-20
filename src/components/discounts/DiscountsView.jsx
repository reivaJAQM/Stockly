import React, { useState } from 'react';
import { Tag, Plus, CheckCircle, Percent, Sparkles, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DiscountsView = () => {
  const { formatCurrency } = useApp();
  const [coupons, setCoupons] = useState([
    { id: '1', code: 'BIENVENIDO10', discount: 10, type: 'percent', validUntil: '2024-12-31', uses: 48, status: 'Activo' },
    { id: '2', code: 'VERANO2024', discount: 15, type: 'percent', validUntil: '2024-08-31', uses: 112, status: 'Activo' },
    { id: '3', code: 'CLIENTEVIP', discount: 20, type: 'percent', validUntil: '2024-10-15', uses: 35, status: 'Activo' }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ code: '', discount: '10', type: 'percent', validUntil: '2024-12-31' });

  const handleAddCoupon = (e) => {
    e.preventDefault();
    if (!formData.code) return;
    setCoupons([
      ...coupons,
      {
        id: String(Date.now()),
        code: formData.code.toUpperCase(),
        discount: Number(formData.discount),
        type: formData.type,
        validUntil: formData.validUntil,
        uses: 0,
        status: 'Activo'
      }
    ]);
    setIsModalOpen(false);
    setFormData({ code: '', discount: '10', type: 'percent', validUntil: '2024-12-31' });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Descuentos y Promociones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Crea cupones de descuento y promociones especiales para tus clientes.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-2xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Cupón</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-xl font-mono font-bold text-xs">
                {coupon.code}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                {coupon.status}
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-900">{coupon.discount}%</span>
              <span className="text-xs text-slate-500 font-medium">de descuento directo</span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{coupon.uses} veces utilizado</span>
              <span>Expira: {coupon.validUntil}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Nuevo Cupón de Descuento</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCoupon} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Código del Cupón *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. OFERTA15"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Porcentaje de Descuento (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  placeholder="15"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fecha de Expiración</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 bg-white"
                />
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20"
                >
                  Guardar Cupón
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
