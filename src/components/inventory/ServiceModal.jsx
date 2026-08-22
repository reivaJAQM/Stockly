import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomSelect } from '../common/CustomSelect';
import {
  X,
  Zap,
  Tag,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2
} from 'lucide-react';

export const ServiceModal = ({ isOpen, onClose, serviceToEdit }) => {
  const { addService, updateService, deleteService, addCategory, data } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    category: 'Servicios',
    defaultPrice: ''
  });

  const existingCategories = Array.from(
    new Set([
      'Servicios',
      'Recargas',
      'Servicios Digitales',
      'Mantenimiento',
      ...(data.categories || []).map((c) => c.name)
    ])
  );

  const categoryOptions = existingCategories.map((cat) => ({
    value: cat,
    label: cat
  }));

  useEffect(() => {
    if (serviceToEdit) {
      setFormData({
        name: serviceToEdit.name || '',
        category: serviceToEdit.category || 'Servicios',
        defaultPrice: serviceToEdit.defaultPrice ? String(serviceToEdit.defaultPrice) : ''
      });
    } else {
      setFormData({
        name: '',
        category: 'Servicios',
        defaultPrice: ''
      });
    }
  }, [serviceToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim() || 'Servicios',
      defaultPrice: Number(formData.defaultPrice || 0)
    };

    if (serviceToEdit) {
      await updateService(serviceToEdit.id, payload);
    } else {
      await addService(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
                {serviceToEdit ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ventas recurrentes sin control de stock ni costo (ingreso directo)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Service Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Nombre del Servicio / Recarga <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Recarga Free Fire, Recarga Móvil, Impresiones..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Default Price */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Precio Sugerido / Referencial <span className="text-slate-400 font-normal text-[11px]">(Opcional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00 (Puedes definir el valor en cada venta)"
                value={formData.defaultPrice}
                onChange={(e) => setFormData({ ...formData, defaultPrice: e.target.value })}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 font-semibold"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Si el precio varía en cada recarga o venta, puedes dejarlo en $0.00 e ingresar el monto al cobrar en el Punto de Venta.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {serviceToEdit ? (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`¿Estás seguro de eliminar el servicio "${serviceToEdit.name}"?`)) {
                    await deleteService(serviceToEdit.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Eliminar servicio del catálogo"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                {serviceToEdit ? 'Guardar Cambios' : 'Guardar Servicio'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
