import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from './StatCard';
import { SalesChart } from './SalesChart';
import { TopProducts } from './TopProducts';
import { RecentSales } from './RecentSales';
import { LowStockWidget } from './LowStockWidget';
import { RecentActivity } from './RecentActivity';
import {
  IconSales,
  IconExpenses,
  IconCustomers,
  IconInventory
} from '../common/StocklyIcons';
import {
  Calendar,
  ChevronDown
} from 'lucide-react';

export const DashboardView = () => {
  const { data, formatCurrency, dateRange, setDateRange, setActiveTab } = useApp();

  const totalStockUnits = (data.products || []).reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalExpenses = (data.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Date Filter Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            ¡Bienvenido de vuelta, {data.storeInfo.user.name.split(' ')[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Este es el resumen de tu negocio
          </p>
        </div>

        {/* Date Filter Dropdown */}
        <div className="relative inline-block self-start sm:self-auto">
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none bg-transparent text-xs font-semibold text-slate-800 pr-6 cursor-pointer focus:outline-none"
            >
              <option value="30days">Últimos 30 días</option>
              <option value="thisMonth">Este mes</option>
              <option value="thisWeek">Esta semana</option>
              <option value="today">Hoy</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Row 1: 4 KPI Cards aligned 1:1 with main Navbar sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Ventas"
          value={formatCurrency(data.kpis?.totalSales || 0)}
          growth={data.kpis?.totalSalesGrowth || 0}
          growthLabel="ingresos registrados"
          icon={IconSales}
          iconBg="bg-blue-50/80 border-blue-200/70 text-blue-600 shadow-xs"
          onClick={() => setActiveTab('sales')}
        />

        <StatCard
          title="Gastos"
          value={formatCurrency(totalExpenses)}
          growth={0}
          growthLabel="egresos en caja"
          icon={IconExpenses}
          iconBg="bg-rose-50/80 border-rose-200/70 text-rose-600 shadow-xs"
          onClick={() => setActiveTab('expenses')}
        />

        <StatCard
          title="Clientes"
          value={Number(data.kpis?.newCustomersCount || (data.customers || []).length || 0).toLocaleString('en-US')}
          growth={data.kpis?.customersGrowth || 0}
          growthLabel="en directorio"
          icon={IconCustomers}
          iconBg="bg-purple-50/80 border-purple-200/70 text-purple-600 shadow-xs"
          onClick={() => setActiveTab('customers')}
        />

        <StatCard
          title="Inventario"
          value={`${totalStockUnits} u.`}
          growth={0}
          growthLabel={`${data.products.length} productos en stock`}
          icon={IconInventory}
          iconBg="bg-amber-50/80 border-amber-200/70 text-amber-600 shadow-xs"
          onClick={() => setActiveTab('inventory')}
        />
      </div>

      {/* Row 2: Sales Trend and Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 xl:col-span-8 h-full">
          <SalesChart />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 h-full">
          <TopProducts />
        </div>
      </div>

      {/* Row 3: Recent Sales, Low Stock, Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-6 xl:col-span-5 h-full">
          <RecentSales />
        </div>
        <div className="lg:col-span-6 xl:col-span-4 h-full">
          <LowStockWidget />
        </div>
        <div className="lg:col-span-12 xl:col-span-3 h-full">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};
