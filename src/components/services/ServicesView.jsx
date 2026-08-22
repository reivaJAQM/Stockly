import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Plus,
  Search,
  Zap,
  Edit2,
  Trash2,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export const ServicesView = () => {
  const {
    data,
    formatCurrency,
    setIsServiceModalOpen,
    setEditingService,
    deleteService
  } = useApp();

  const [search, setSearch] = useState('');

  const servicesList = data.services || [];
  const totalServices = servicesList.length;
  const totalServicesSalesCount = servicesList.reduce((sum, s) => sum + (Number(s.totalSales) || 0), 0);
  const totalServicesRevenue = servicesList.reduce((sum, s) => sum + (Number(s.totalRevenue) || 0), 0);

  const filteredServices = servicesList.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditService = (service) => {
    setEditingService(service);
    setIsServiceModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            Servicios
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Administra tus servicios intangibles, recargas y ventas recurrentes sin control de existencias ni costos.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingService(null);
            setIsServiceModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Servicio</span>
        </button>
      </div>

      {/* Services Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Zap className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400">Servicios en Catálogo</span>
            <h4 className="text-xl font-extrabold text-slate-900">{totalServices} disponibles</h4>
            <span className="text-[10px] text-slate-500 font-medium">Servicios en catálogo</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400">Total Ventas Realizadas</span>
            <h4 className="text-xl font-extrabold text-blue-600">{totalServicesSalesCount} ventas</h4>
            <span className="text-[10px] text-slate-500 font-medium">Transacciones de servicios</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400">Ingresos Totales por Servicios</span>
            <h4 className="text-xl font-extrabold text-emerald-600">{formatCurrency(totalServicesRevenue)}</h4>
            <span className="text-[10px] text-emerald-700 font-bold">100% Margen (Sin costos)</span>
          </div>
        </div>
      </div>

      {/* Search & Counter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar servicio por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
          />
        </div>

        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100 whitespace-nowrap self-end sm:self-auto">
          {filteredServices.length} {filteredServices.length === 1 ? 'servicio registrado' : 'servicios registrados'}
        </span>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-3xl border border-slate-100/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Servicio</th>
                <th className="py-3.5 px-4 text-center">Precio Sugerido</th>
                <th className="py-3.5 px-4 text-center">Ventas Realizadas</th>
                <th className="py-3.5 px-4 text-center">Ingresos Acumulados</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 text-xs">
                    <Zap className="w-8 h-8 mx-auto text-amber-300 mb-2 fill-amber-300" />
                    <p className="font-bold text-slate-700">No hay servicios registrados</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Haz clic en "+ Nuevo Servicio" para registrar servicios en tu catálogo.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => {
                  const hasPrice = Number(service.defaultPrice || 0) > 0;

                  return (
                    <tr key={service.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center flex-shrink-0 shadow-xs">
                            <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{service.name}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {hasPrice ? (
                          <span className="font-bold text-slate-900">{formatCurrency(service.defaultPrice)}</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold inline-block">
                            Variable al cobrar
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl text-[11px] inline-block">
                          {service.totalSales || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600 text-xs">
                        {formatCurrency(service.totalRevenue || 0)}
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditService(service)}
                            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
                            title="Editar servicio"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de eliminar el servicio "${service.name}"?`)) {
                                deleteService(service.id);
                              }
                            }}
                            className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                            title="Eliminar servicio"
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
