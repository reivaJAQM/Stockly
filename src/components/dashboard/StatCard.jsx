import React from 'react';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  iconBg = "bg-blue-50 border-blue-100 text-blue-600",
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm transition-all duration-200 flex flex-col justify-center group ${
        onClick
          ? 'cursor-pointer hover:shadow-md hover:border-slate-300/80 hover:-translate-y-0.5 active:scale-[0.98]'
          : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 tracking-tight group-hover:text-blue-600 transition-colors">
            {title}
          </span>
          <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs transition-transform duration-200 group-hover:scale-110 flex-shrink-0 ${iconBg}`}>
          <Icon className="w-6 h-6 stroke-[2.1]" />
        </div>
      </div>
    </div>
  );
};
