import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../dashboard/StatCard';
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
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-extrabold rounded-2xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Servicio</span>
        </button>
      </div>

      {/* Services Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Servicios en Catálogo"
          value={totalServices}
          icon={Zap}
          iconBg="bg-amber-50 border-amber-100 text-amber-600"
        />

        <StatCard
          title="Total Ventas Realizadas"
          value={totalServicesSalesCount}
          icon={CheckCircle2}
          iconBg="bg-blue-50 border-blue-100 text-blue-600"
        />

        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(totalServicesRevenue)}
          icon={DollarSign}
          iconBg="bg-emerald-50 border-emerald-100 text-emerald-600"
        />
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
          />
        </div>

        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-100 whitespace-nowrap self-end sm:self-auto">
          {filteredServices.length} {filteredServices.length === 1 ? 'servicio' : 'servicios'}
        </span>
      </div>

      {/* Services Table - Stockly Dashboard Style (Harmonious, Centered, Elegant) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm">
        <div className="overflow-x-auto">
          {filteredServices.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-xs">
              <Zap className="w-10 h-10 mx-auto text-amber-300 mb-2 fill-amber-300" />
              <p className="font-bold text-slate-700 text-sm">No hay servicios registrados</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Haz clic en "+ Nuevo Servicio" para registrar servicios en tu catálogo.
              </p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100/90 pb-3">
                  <th className="pb-3 px-3 text-left font-semibold w-5/12">Servicio</th>
                  <th className="pb-3 px-3 text-center font-semibold w-2/12 whitespace-nowrap">Precio Sugerido</th>
                  <th className="pb-3 px-3 text-center font-semibold w-2/12 whitespace-nowrap">Ventas Realizadas</th>
                  <th className="pb-3 px-3 text-center font-semibold w-2/12 whitespace-nowrap">Ingresos Acumulados</th>
                  <th className="pb-3 px-3 text-center font-semibold w-1.5/12 whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {filteredServices.map((service) => {
                  const hasPrice = Number(service.defaultPrice || 0) > 0;

                  return (
                    <tr key={service.id} className="hover:bg-slate-50/90 transition-colors group">
                      {/* Service Name & Icon */}
                      <td className="py-3.5 px-3 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100/80 flex items-center justify-center flex-shrink-0 shadow-2xs text-amber-600">
                            <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                          </div>
                          <span className="font-bold text-slate-800 text-xs line-clamp-2">
                            {service.name}
                          </span>
                        </div>
                      </td>

                      {/* Suggested Price */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {hasPrice ? (
                          <span className="font-extrabold text-slate-900 text-xs tabular-nums">
                            {formatCurrency(service.defaultPrice)}
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            Variable
                          </span>
                        )}
                      </td>

                      {/* Sales Count */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200/80 tabular-nums">
                          {service.totalSales || 0} {(service.totalSales || 0) === 1 ? 'venta' : 'ventas'}
                        </span>
                      </td>

                      {/* Total Revenue */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="font-extrabold text-slate-900 text-xs tabular-nums">
                          {formatCurrency(service.totalRevenue || 0)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditService(service)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
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
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar servicio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Summary */}
        {filteredServices.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 font-medium">
              Mostrando {filteredServices.length} {filteredServices.length === 1 ? 'servicio' : 'servicios'}
            </span>
            <span className="text-[11px] font-bold text-slate-600">
              Ingresos totales: {formatCurrency(filteredServices.reduce((sum, s) => sum + (Number(s.totalRevenue) || 0), 0))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
