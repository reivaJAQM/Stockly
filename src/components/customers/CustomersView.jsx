import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../dashboard/StatCard';
import { CustomSelect } from '../common/CustomSelect';
import { CustomerDebtsModal } from '../dashboard/CustomerDebtsModal';
import { CustomerHistoryModal } from './CustomerHistoryModal';
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
  Edit2,
  Trash2,
  User,
  HandCoins,
  Award,
  ArrowUpDown,
  LayoutGrid,
  List,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Nombre: A - Z' },
  { value: 'name-desc', label: 'Nombre: Z - A' },
  { value: 'debt-desc', label: 'Mayor deuda primero' },
  { value: 'spent-desc', label: 'Mayor compra primero' },
  { value: 'recent', label: 'Más recientes primero' }
];

export const CustomersView = () => {
  const {
    data,
    formatCurrency,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    isCustomerModalOpen,
    setIsCustomerModalOpen,
    editingCustomer,
    setEditingCustomer
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'debt' | 'upToDate' | 'vip'
  const [sortBy, setSortBy] = useState('name-asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals state
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState(null);
  const [selectedCustomerForDebts, setSelectedCustomerForDebts] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  const customers = data.customers || [];
  const orders = data.orders || [];

  // Sync formData whenever modal opens or editingCustomer changes
  useEffect(() => {
    if (isCustomerModalOpen) {
      if (editingCustomer) {
        setFormData({
          name: editingCustomer.name || '',
          email: editingCustomer.email || '',
          phone: editingCustomer.phone || '',
          notes: editingCustomer.notes || ''
        });
      } else {
        setFormData({ name: '', email: '', phone: '', notes: '' });
      }
    }
  }, [isCustomerModalOpen, editingCustomer]);

  // Aggregate Metrics
  const totalCustomersCount = customers.length;
  const totalDebtSum = customers.reduce((sum, c) => sum + (Number(c.totalDebt) || 0), 0);
  const totalSpentSum = customers.reduce((sum, c) => sum + (Number(c.totalSpent) || 0), 0);

  // Top Customer
  const topCustomer = customers.length > 0
    ? [...customers].sort((a, b) => (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0))[0]
    : null;

  // Filter Counts
  const countDebt = customers.filter((c) => Number(c.totalDebt || 0) > 0).length;
  const countFeatured = customers.filter((c) => Number(c.totalSpent || 0) > 0).length;

  // Filtered list
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search));

    if (!matchesSearch) return false;

    if (statusFilter === 'debt') return Number(c.totalDebt || 0) > 0;
    if (statusFilter === 'featured') return Number(c.totalSpent || 0) > 0;

    return true;
  });

  // Sorted list
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    }
    if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' });
    }
    if (sortBy === 'debt-desc') {
      return (Number(b.totalDebt) || 0) - (Number(a.totalDebt) || 0);
    }
    if (sortBy === 'spent-desc') {
      return (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0);
    }
    if (sortBy === 'recent') {
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    }
    return 0;
  });

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', notes: '' });
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditModal = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name || '',
      email: cust.email || '',
      phone: cust.phone || '',
      notes: cust.notes || ''
    });
    setIsCustomerModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCustomerModalOpen(false);
    setEditingCustomer(null);
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
    setIsCustomerModalOpen(false);
    setEditingCustomer(null);
  };

  const handleDelete = async (cust) => {
    if (window.confirm(`¿Estás seguro de eliminar a "${cust.name}" del directorio?`)) {
      await deleteCustomer(cust.id);
    }
  };

  // Helper to open debt payment modal for a specific customer
  const handleOpenDebtForCustomer = (cust) => {
    const custOrders = orders.filter((o) => {
      if (o.status === 'Cancelado') return false;
      const matchId = (o.customerId && String(o.customerId) === String(cust.id)) ||
        (o.customer?.id && String(o.customer.id) === String(cust.id));
      const matchName = o.customer?.name && cust.name &&
        o.customer.name.trim().toLowerCase() === cust.name.trim().toLowerCase();
      const bal = Number(o.balanceDue !== undefined ? o.balanceDue : (o.balance_due || 0));
      return (matchId || matchName) && bal > 0;
    });

    setSelectedCustomerForDebts({
      customer: cust,
      orders: custOrders
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Directorio de Clientes
          </h1>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clientes"
          value={totalCustomersCount}
          icon={Users}
          iconBg="bg-blue-50 border-blue-100 text-blue-600"
          onClick={() => setStatusFilter('all')}
        />

        <StatCard
          title="Por Cobrar"
          value={formatCurrency(totalDebtSum)}
          icon={HandCoins}
          iconBg={totalDebtSum > 0 ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}
          onClick={() => setStatusFilter('debt')}
        />

        <StatCard
          title="Ventas a Clientes"
          value={formatCurrency(totalSpentSum)}
          icon={DollarSign}
          iconBg="bg-emerald-50 border-emerald-100 text-emerald-600"
          onClick={() => setStatusFilter('featured')}
        />

        <div
          onClick={() => {
            if (topCustomer) setSelectedCustomerForHistory(topCustomer);
          }}
          className="bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm transition-all duration-200 flex flex-col justify-center group cursor-pointer hover:shadow-md hover:border-slate-300/80 hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-xs font-semibold text-slate-500 tracking-tight group-hover:text-blue-600 transition-colors block">
                Cliente Destacado
              </span>
              <h3 className="text-lg lg:text-xl font-extrabold mt-0.5 tracking-tight text-slate-900 truncate" title={topCustomer?.name || 'Ninguno'}>
                {topCustomer && Number(topCustomer.totalSpent) > 0 ? topCustomer.name : 'Sin compras'}
              </h3>
              {topCustomer && Number(topCustomer.totalSpent) > 0 && (
                <span className="text-xs font-bold text-amber-600 block mt-0.5">
                  {formatCurrency(topCustomer.totalSpent)} comprados
                </span>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs transition-transform duration-200 group-hover:scale-110 flex-shrink-0 bg-amber-50 border-amber-100 text-amber-600">
              <Award className="w-6 h-6 stroke-[2.1]" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs, Search Bar, Sort & View Mode Controls */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Symmetrical Segmented Tabs */}
          <div className="flex p-1 bg-slate-100/80 rounded-2xl gap-1 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              Todos ({totalCustomersCount})
            </button>
            <button
              onClick={() => setStatusFilter('debt')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${statusFilter === 'debt'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              <span>Con Deuda</span>
              {countDebt > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black">
                  {countDebt}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('featured')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'featured'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              Clientes Destacados ({countFeatured})
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 self-end lg:self-auto bg-slate-100/80 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
                }`}
              title="Vista de cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
                }`}
              title="Vista de tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
            />
          </div>

          <div className="w-full sm:w-64 flex-shrink-0">
            <CustomSelect
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS}
              icon={ArrowUpDown}
              placeholder="Ordenar por..."
            />
          </div>
        </div>
      </div>

      {/* Customer Display: Grid View vs Table View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCustomers.map((customer) => {
            const hasDebt = Number(customer.totalDebt || 0) > 0;

            return (
              <div
                key={customer.id}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative"
              >
                {/* Top info */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      onClick={() => setSelectedCustomerForHistory(customer)}
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-black text-lg flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors" title={customer.name}>
                          {customer.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Cliente desde {customer.joinedDate || '2024'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setSelectedCustomerForHistory(customer)}
                        title="Ver historial y órdenes"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(customer)}
                        title="Editar Cliente"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer)}
                        title="Eliminar Cliente"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact info list */}
                  <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                    {customer.phone ? (
                      <div className="flex items-center gap-2 text-slate-700 px-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <a
                          href={`tel:${customer.phone}`}
                          className="truncate font-medium font-mono text-xs hover:text-blue-600 hover:underline"
                        >
                          {customer.phone}
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 text-xs px-1">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="italic">Sin teléfono</span>
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
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="italic">Sin correo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Spending & Debt stats */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Comprado</span>
                      <span className="font-extrabold text-blue-600 text-sm">{formatCurrency(customer.totalSpent || 0)}</span>
                    </div>

                    <div className={`p-2.5 rounded-xl text-center border ${hasDebt
                        ? 'bg-rose-50 border-rose-200/80 text-rose-700'
                        : 'bg-slate-50 border-slate-100 text-slate-800'
                      }`}>
                      <span className={`text-[10px] font-bold block uppercase tracking-wider ${hasDebt ? 'text-rose-600' : 'text-slate-400'
                        }`}>
                        {hasDebt ? 'Deuda Pendiente' : 'Estado Cuenta'}
                      </span>
                      <span className={`font-extrabold text-sm ${hasDebt ? 'text-rose-700' : 'text-emerald-600'
                        }`}>
                        {hasDebt ? formatCurrency(customer.totalDebt) : 'Al día'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCustomerForHistory(customer)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Historial</span>
                    </button>

                    {hasDebt && (
                      <button
                        onClick={() => handleOpenDebtForCustomer(customer)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
                      >
                        <HandCoins className="w-3.5 h-3.5" />
                        <span>Abonar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Cliente</th>
                  <th className="py-3.5 px-4">Contacto</th>
                  <th className="py-3.5 px-4 text-center">Total Comprado</th>
                  <th className="py-3.5 px-4 text-center">Estado de Deuda</th>
                  <th className="py-3.5 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {sortedCustomers.map((customer) => {
                  const hasDebt = Number(customer.totalDebt || 0) > 0;

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedCustomerForHistory(customer)}
                    >
                      {/* Name & Joined Date */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-black text-sm flex items-center justify-center flex-shrink-0 border border-blue-100">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors">
                              {customer.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Desde {customer.joinedDate || '2024'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {customer.phone ? (
                            <p className="font-mono text-slate-700 font-medium">
                              {customer.phone}
                            </p>
                          ) : (
                            <p className="text-slate-400 italic text-[11px]">Sin teléfono</p>
                          )}
                          {customer.email && (
                            <p className="text-slate-400 text-[11px] truncate max-w-[180px]">
                              {customer.email}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4 text-center font-extrabold text-blue-600 text-sm">
                        {formatCurrency(customer.totalSpent || 0)}
                      </td>

                      {/* Debt Status */}
                      <td className="py-3.5 px-4 text-center">
                        {hasDebt ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200/80">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Debe {formatCurrency(customer.totalDebt)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Al día
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {hasDebt && (
                            <button
                              onClick={() => handleOpenDebtForCustomer(customer)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                              title="Registrar Abono"
                            >
                              <HandCoins className="w-3.5 h-3.5" />
                              <span>Abonar</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedCustomerForHistory(customer)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Ver Historial"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(customer)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Editar Cliente"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar Cliente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {sortedCustomers.length === 0 && (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-center bg-white rounded-3xl border border-slate-100 p-6">
          <Users className="w-12 h-12 mb-3 text-slate-300 stroke-[1.5]" />
          <p className="font-bold text-base text-slate-700">No se encontraron clientes</p>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            {search
              ? 'No hay clientes que coincidan con los criterios de búsqueda o filtro.'
              : 'Registra a tus clientes habituales para gestionar compras y ventas a crédito / fiado.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            + Agregar Nuevo Cliente
          </button>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      <CustomerHistoryModal
        customer={selectedCustomerForHistory}
        isOpen={!!selectedCustomerForHistory}
        onClose={() => setSelectedCustomerForHistory(null)}
        orders={orders}
        formatCurrency={formatCurrency}
        onOpenDebtModal={(cust, pendingOrders) => {
          setSelectedCustomerForHistory(null);
          setSelectedCustomerForDebts({
            customer: cust,
            orders: pendingOrders
          });
        }}
      />

      {/* Customer Debt & Payment Settlement Modal */}
      <CustomerDebtsModal
        isOpen={!!selectedCustomerForDebts}
        onClose={() => setSelectedCustomerForDebts(null)}
        customerDebtData={selectedCustomerForDebts}
      />

      {/* Create / Edit Customer Modal */}
      {isCustomerModalOpen && (
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
                onClick={handleCloseModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                  Teléfono <span className="text-slate-400 font-normal text-[11px]">(Opcional)</span>
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
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
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
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
