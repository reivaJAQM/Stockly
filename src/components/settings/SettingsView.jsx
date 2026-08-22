import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Store,
  DollarSign,
  User,
  Shield,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const SettingsView = () => {
  const { data, updateSettings } = useApp();

  const [formData, setFormData] = useState({
    name: data.storeInfo?.name || 'Mi Negocio',
    currency: data.storeInfo?.currency || 'USD',
    currencySymbol: data.storeInfo?.currencySymbol || '$',
    taxRate: data.storeInfo?.taxRate || 16,
    address: data.storeInfo?.address || '',
    phone: data.storeInfo?.phone || '',
    userName: data.storeInfo?.user?.name || 'Alejandro',
    userEmail: data.storeInfo?.user?.email || 'alejandro@stockly.app'
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    await updateSettings({
      name: formData.name,
      currency: formData.currency,
      currencySymbol: formData.currencySymbol,
      taxRate: Number(formData.taxRate),
      address: formData.address,
      phone: formData.phone,
      user: {
        name: formData.userName,
        email: formData.userEmail
      }
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Export full JSON backup
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stockly_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Import JSON backup
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.products && parsed.orders) {
          setData(parsed);
          alert("¡Copia de seguridad restaurada con éxito!");
        } else {
          alert("El archivo no tiene el formato de respaldo válido de Stockly.");
        }
      } catch (err) {
        alert("Error al leer el archivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          Configuración del Negocio
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
          Personaliza los datos de tu empresa, moneda, tasa de impuestos y copias de seguridad.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>¡Configuración guardada correctamente en el sistema!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Business Info Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Datos de la Empresa</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nombre Comercial del Negocio</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Teléfono de Contacto</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dirección Física (Para Tickets/Facturas)</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
            />
          </div>
        </div>

        {/* Currency & Tax Rates Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Moneda e Impuestos</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Moneda Principal</label>
              <select
                value={formData.currency}
                onChange={(e) => {
                  const symbol = e.target.value === 'EUR' ? '€' : '$';
                  setFormData({ ...formData, currency: e.target.value, currencySymbol: symbol });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-slate-800 bg-white"
              >
                <option value="USD">USD ($) Dólar estadounidense</option>
                <option value="MXN">MXN ($) Peso mexicano</option>
                <option value="EUR">EUR (€) Euro</option>
                <option value="COP">COP ($) Peso colombiano</option>
                <option value="ARS">ARS ($) Peso argentino</option>
                <option value="CLP">CLP ($) Peso chileno</option>
                <option value="PEN">PEN (S/) Sol peruano</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Símbolo Monetario</label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-slate-800 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tasa de Impuesto / IVA (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-slate-800 font-bold"
              />
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-sm text-slate-900">Perfil de Administrador</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-slate-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={formData.userEmail}
                onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none text-slate-800"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold rounded-2xl shadow-md shadow-blue-500/20 transition-all text-xs"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Toda la Configuración</span>
          </button>
        </div>
      </form>

      {/* Backup & System Maintenance */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Shield className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-sm text-slate-900">Copias de Seguridad y Datos</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleExportJSON}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold flex flex-col items-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5 text-blue-600" />
            <span>Descargar Copia JSON</span>
          </button>

          <label className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold flex flex-col items-center gap-2 transition-colors cursor-pointer text-center">
            <Upload className="w-5 h-5 text-emerald-600" />
            <span>Restaurar Copia JSON</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (window.confirm("¿Restaurar los datos de demostración originales del mockup?")) {
                resetToSampleData();
              }
            }}
            className="p-4 rounded-2xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-700 font-semibold flex flex-col items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-rose-600" />
            <span>Restablecer Datos Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
