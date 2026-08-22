import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import {
  IconDashboard,
  IconProducts,
  IconInventory,
  IconSales,
  IconExpenses,
  IconCustomers,
  IconReports,
  IconSettings
} from '../common/StocklyIcons';
import {
  ChevronDown,
  ChevronRight,
  Store,
  Sparkles,
  Zap
} from 'lucide-react';

export const Sidebar = ({ isOpen, setIsOpen }) => {
  const { activeTab, setActiveTab, data } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: IconDashboard },
    { id: 'inventory', label: 'Inventario', icon: IconInventory },
    { id: 'services', label: 'Servicios', icon: Zap },
    { id: 'sales', label: 'Ventas', icon: IconSales },
    { id: 'expenses', label: 'Gastos', icon: IconExpenses },
    { id: 'customers', label: 'Clientes', icon: IconCustomers },
    { id: 'charts', label: 'Gráficos', icon: IconReports },
    { id: 'settings', label: 'Configuración', icon: IconSettings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#0d1527] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800 shadow-2xl lg:shadow-none`}
      >
        {/* Brand Logo Header */}
        <div>
          <div className="h-20 flex items-center px-6 border-b border-slate-800/80">
            <Logo size="md" isDark={true} />
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 1024) setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon
                    size={20}
                    className={`transition-colors flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className={isActive ? 'font-semibold text-white' : ''}>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-xs shadow-cyan-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Section */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0a1120]">
          {/* User Profile */}
          <div
            onClick={() => setActiveTab('settings')}
            className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-800/60 transition-colors cursor-pointer group"
          >
            <div className="relative">
              {data.storeInfo.user.avatar ? (
                <img
                  src={data.storeInfo.user.avatar}
                  alt={data.storeInfo.user.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/30"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-extrabold text-white text-sm shadow-md shadow-blue-500/20 ring-2 ring-blue-500/30">
                  {data.storeInfo.user.name?.charAt(0) || 'A'}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0a1120]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate group-hover:text-blue-400 transition-colors">
                {data.storeInfo.user.name}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{data.storeInfo.user.role}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
          </div>
        </div>
      </aside>
    </>
  );
};
