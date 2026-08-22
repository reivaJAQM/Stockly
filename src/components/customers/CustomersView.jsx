import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  ShoppingBag,
  X,
  MessageCircle,
  Edit2,
  Trash2,
  UserCheck,
  User
} from 'lucide-react';

export const CustomersView = () => {
  const { data, formatCurrency, addCustomer, updateCustomer, deleteCustomer } = useApp();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  const customers = data.customers || [];

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search))
  );

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name || '',
      email: cust.email || '',
      phone: cust.phone || '',
      notes: cust.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, formData);
    } else {
      await addCustomer(formData);
    }

    setFormData({ name: '', email: '', phone: '', notes: '' });
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleDelete = async (cust) => {
    if (window.confirm(`¿Estás seguro de eliminar a "${cust.name}" del directorio?`)) {
      await deleteCustomer(cust.id);
    }
  };

  const handleWhatsAppClick = (phone) => {
    if (!phone) return;
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0') && clean.length === 10) {
      clean = '593' + clean.substring(1);
    } else if (clean.length === 9 && clean.startsWith('9')) {
      clean = '593' + clean;
    } else if (!clean.startsWith('593')) {
      clean = '593' + clean;
    }
    window.open(`https://wa.me/${clean}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Directorio de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Gestiona información de contacto, teléfonos y compras de clientes.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Search Bar & Total Counter */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
          />
        </div>

        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
          {filteredCustomers.length} clientes registrados
        </span>
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
          >
            {/* Top info */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-black text-lg flex-shrink-0 shadow-2xs">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate" title={customer.name}>
                      {customer.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Cliente desde {customer.joinedDate || '2024'}
                    </p>
                  </div>
                </div>

                {/* Edit & Delete Action icons */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEditModal(customer)}
                    title="Editar Cliente"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer)}
                    title="Eliminar Cliente"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Contact info list with WhatsApp direct action */}
              <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                {customer.phone ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <div className="flex items-center gap-2 min-w-0 font-bold text-emerald-950">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{customer.phone}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleWhatsAppClick(customer.phone)}
                      className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs transition-all"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Sin teléfono registrado</span>
                  </div>
                )}

                {customer.email ? (
                  <div className="flex items-center gap-2 text-slate-600 px-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <a
                      href={`mailto:${customer.email}`}
                      className="truncate hover:text-blue-600 hover:underline"
                    >
                      {customer.email}
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 text-xs px-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Sin correo registrado</span>
                  </div>
                )}
              </div>
            </div>

              {/* Spending & Debt stats summary */}
              <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Comprado</span>
                  <span className="font-extrabold text-blue-600 text-sm">{formatCurrency(customer.totalSpent || 0)}</span>
                </div>
                <div className={`p-2.5 rounded-xl text-center border ${
                  Number(customer.totalDebt || 0) > 0
                    ? 'bg-rose-50 border-rose-200/80 text-rose-700'
                    : 'bg-slate-50 border-slate-100 text-slate-800'
                }`}>
                  <span className={`text-[10px] font-bold block uppercase tracking-wider ${
                    Number(customer.totalDebt || 0) > 0 ? 'text-rose-600' : 'text-slate-400'
                  }`}>
                    {Number(customer.totalDebt || 0) > 0 ? 'Deuda Pendiente' : 'Estado Cuenta'}
                  </span>
                  <span className={`font-extrabold text-sm ${
                    Number(customer.totalDebt || 0) > 0 ? 'text-rose-700' : 'text-emerald-600'
                  }`}>
                    {Number(customer.totalDebt || 0) > 0 ? formatCurrency(customer.totalDebt) : 'Al día'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 text-center bg-white rounded-3xl border border-slate-100 p-6">
              <Users className="w-12 h-12 mb-3 text-slate-300 stroke-[1.5]" />
              <p className="font-bold text-base text-slate-700">No se encontraron clientes</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Registra a tus clientes habituales para gestionar compras al contado y ventas a crédito / fiado.
              </p>
              <button
                onClick={handleOpenCreateModal}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              + Agregar Primer Cliente
            </button>
          </div>
        )}
      </div>

      {/* New / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingCustomer ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Alejandro Quijije"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Teléfono / WhatsApp <span className="text-slate-400 font-normal text-[11px]">(Opcional)</span>
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
                  <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-700 select-none flex-shrink-0">
                    <span>🇪🇨</span>
                    <span>+593</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="0969262924"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 bg-transparent font-medium focus:outline-none text-slate-800 text-xs placeholder:text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo Electrónico (Opcional)</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas o Dirección (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Dirección de entrega, observaciones..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
                >
                  {editingCustomer ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
