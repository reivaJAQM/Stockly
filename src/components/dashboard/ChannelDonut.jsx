import React from 'react';
import { useApp } from '../../context/AppContext';
import { Banknote, ArrowRightLeft, HandCoins } from 'lucide-react';

export const ChannelDonut = () => {
  const { data, formatCurrency } = useApp();

  // Aggregate real payment methods from registered orders
  const orders = data.orders || [];
  const totalSales = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const cashTotal = orders
    .filter((o) => (o.paymentMethod || '').toLowerCase().includes('efectivo') || (o.paymentMethod || '').toLowerCase().includes('cash'))
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const transferTotal = orders
    .filter((o) => (o.paymentMethod || '').toLowerCase().includes('transferencia') || (o.paymentMethod || '').toLowerCase().includes('transfer'))
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const creditTotal = orders
    .filter((o) => (o.paymentMethod || '').toLowerCase().includes('crédito') || (o.paymentMethod || '').toLowerCase().includes('credito') || (o.paymentMethod || '').toLowerCase().includes('fiado'))
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const methods = [
    {
      id: 'cash',
      name: 'Efectivo',
      amount: cashTotal,
      percentage: totalSales > 0 ? Number(((cashTotal / totalSales) * 100).toFixed(1)) : 0,
      color: '#10b981',
      icon: Banknote
    },
    {
      id: 'credit',
      name: 'Crédito',
      amount: creditTotal,
      percentage: totalSales > 0 ? Number(((creditTotal / totalSales) * 100).toFixed(1)) : 0,
      color: '#f59e0b',
      icon: HandCoins
    },
    {
      id: 'transfer',
      name: 'Transferencia',
      amount: transferTotal,
      percentage: totalSales > 0 ? Number(((transferTotal / totalSales) * 100).toFixed(1)) : 0,
      color: '#8b5cf6',
      icon: ArrowRightLeft
    }
  ];

  // SVG Geometry
  const size = 150;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between h-full min-h-[380px]">
      <div>
        <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">Métodos de Pago</h4>
        <p className="text-[11px] text-slate-400 font-medium">Distribución de cobros del negocio</p>
      </div>

      {/* Donut graphic */}
      <div className="relative flex items-center justify-center my-3">
        <svg width={size} height={size} className="transform -rotate-90">
          {totalSales === 0 ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />
          ) : (
            methods.map((method) => {
              if (method.percentage === 0) return null;
              const strokeDasharray = `${(method.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += method.percentage;

              return (
                <circle
                  key={method.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={method.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              );
            })
          )}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-semibold text-slate-400">Total Cobrado</span>
          <span className="text-sm font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(totalSales)}
          </span>
        </div>
      </div>

      {/* Payment methods list */}
      <div className="space-y-2 text-xs">
        {methods.map((method) => (
          <div key={method.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: method.color }}
              />
              <span className="text-slate-700 font-semibold">{method.name}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <span>{formatCurrency(method.amount)}</span>
              <span className="text-slate-400 font-normal text-[11px]">({method.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
