import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingCart, Package, User, ClipboardList, CreditCard } from 'lucide-react';

export const RecentActivity = () => {
  const { data } = useApp();
  const activities = (data.activityLog || []).slice(0, 5);

  const getIcon = (type, color) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />;
      case 'product':
        return <Package className="w-3.5 h-3.5 text-emerald-600" />;
      case 'customer':
        return <User className="w-3.5 h-3.5 text-purple-600" />;
      case 'inventory':
        return <ClipboardList className="w-3.5 h-3.5 text-amber-600" />;
      case 'expense':
        return <CreditCard className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'sale':
        return 'bg-blue-100/70';
      case 'product':
        return 'bg-emerald-100/70';
      case 'customer':
        return 'bg-purple-100/70';
      case 'inventory':
        return 'bg-amber-100/70';
      case 'expense':
        return 'bg-rose-100/70';
      default:
        return 'bg-slate-100';
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between h-full min-h-[340px]">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-900">Actividad reciente</h4>
        </div>

        <div className="space-y-4 flex-1 flex flex-col justify-center">
          {activities.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <p className="font-semibold text-slate-600 mb-0.5">Sin actividad reciente</p>
              <p className="text-[11px]">Tus ventas, ajustes de stock y gastos aparecerán aquí en orden cronológico.</p>
            </div>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getIconBg(
                    act.type
                  )}`}
                >
                  {getIcon(act.type, act.color)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 leading-snug">
                    {act.title}
                  </p>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {act.time}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
