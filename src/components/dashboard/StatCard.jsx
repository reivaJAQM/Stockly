import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  growth,
  growthLabel = "vs mes anterior",
  icon: Icon,
  iconBg = "bg-blue-50 border-blue-100 text-blue-600",
  isNegativeTrend = false,
  onClick
}) => {
  const isPositive = growth >= 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm transition-all duration-200 flex flex-col justify-between group ${
        onClick
          ? 'cursor-pointer hover:shadow-md hover:border-slate-300/80 hover:-translate-y-0.5 active:scale-[0.98]'
          : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 tracking-tight group-hover:text-blue-600 transition-colors">
            {title}
          </span>
          <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs transition-transform duration-200 group-hover:scale-110 ${iconBg}`}>
          <Icon className="w-6 h-6 stroke-[2.1]" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold">
        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
          (isPositive && !isNegativeTrend) || (!isPositive && isNegativeTrend)
            ? 'text-emerald-700 bg-emerald-50'
            : 'text-rose-700 bg-rose-50'
        }`}>
          {isPositive ? (
            <ArrowUpRight className="w-3.5 h-3.5" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5" />
          )}
          {Math.abs(growth)}%
        </span>
        <span className="text-slate-400 font-normal">{growthLabel}</span>
      </div>
    </div>
  );
};
