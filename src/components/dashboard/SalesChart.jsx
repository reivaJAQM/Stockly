import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronDown, TrendingUp } from 'lucide-react';

export const SalesChart = () => {
  const { data, formatCurrency } = useApp();
  const [viewType, setViewType] = useState('Diario');
  const [activePoint, setActivePoint] = useState(null);

  // Helper to format Date to YYYY-MM-DD
  const getIsoString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Prepare proportional chart data mapped accurately by ISO date
  const chartPoints = useMemo(() => {
    const rawData = data.salesChartData || [];

    // Build date lookup map keyed by ISO Date (YYYY-MM-DD) and raw date strings
    const dataMap = {};
    rawData.forEach((item) => {
      if (item.dateKey) {
        dataMap[item.dateKey] = Number(item.value) || 0;
      }
      if (item.date) {
        dataMap[item.date] = Number(item.value) || 0;
      }
    });

    if (viewType === 'Diario') {
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const isoKey = getIsoString(d);
        const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        
        let val = dataMap[isoKey] ?? dataMap[dateStr] ?? 0;
        
        // If today and sum is in totalSales, ensure current day shows total
        if (i === 0 && val === 0 && Number(data.kpis?.totalSales || 0) > 0) {
          val = Number(data.kpis?.totalSales || 0);
        }

        result.push({
          date: dateStr,
          isoKey,
          value: val
        });
      }
      return result;
    }

    if (viewType === 'Semanal') {
      const result = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const isoKey = getIsoString(d);
        const dateStr = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        
        let val = dataMap[isoKey] ?? dataMap[dateStr] ?? 0;
        if (i === 0 && val === 0 && Number(data.kpis?.totalSales || 0) > 0) {
          val = Number(data.kpis?.totalSales || 0);
        }

        result.push({
          date: dateStr,
          isoKey,
          value: val
        });
      }
      return result;
    }

    if (viewType === 'Mensual') {
      const result = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthLabel = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
        const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        let monthSum = 0;
        Object.keys(dataMap).forEach((k) => {
          if (k.startsWith(monthPrefix)) {
            monthSum += dataMap[k];
          }
        });

        if (i === 0 && monthSum === 0 && Number(data.kpis?.totalSales || 0) > 0) {
          monthSum = Number(data.kpis?.totalSales || 0);
        }

        result.push({
          date: monthLabel,
          value: monthSum
        });
      }
      return result;
    }

    return rawData.map((pt) => ({
      date: pt.date,
      value: Number(pt.value) || 0
    }));
  }, [data.salesChartData, data.kpis?.totalSales, viewType]);

  // Dynamic proportional maximum based on real sales
  const values = chartPoints.map((pt) => Number(pt.value) || 0);
  const highestValue = Math.max(...values, Number(data.kpis?.totalSales || 0), 0);

  const maxVal = useMemo(() => {
    if (highestValue <= 0) return 20;
    if (highestValue <= 10) return 10;
    if (highestValue <= 25) return 25;
    if (highestValue <= 50) return 50;
    if (highestValue <= 100) return 100;
    if (highestValue <= 200) return 200;
    if (highestValue <= 500) return 500;
    if (highestValue <= 1000) return 1000;

    const magnitude = Math.pow(10, Math.floor(Math.log10(highestValue)));
    const step = magnitude >= 100 ? magnitude / 2 : magnitude;
    return Math.ceil((highestValue * 1.15) / step) * step;
  }, [highestValue]);

  // 4 Proportional horizontal Y grid levels
  const yTicks = useMemo(() => {
    return [
      0,
      Math.round(maxVal * 0.25 * 100) / 100,
      Math.round(maxVal * 0.5 * 100) / 100,
      Math.round(maxVal * 0.75 * 100) / 100,
      maxVal
    ];
  }, [maxVal]);

  const formatTickLabel = (val) => {
    if (val === 0) return '$0';
    if (val >= 1000) {
      const inK = val / 1000;
      return `$${inK % 1 === 0 ? inK : inK.toFixed(1)}k`;
    }
    if (Number.isInteger(val)) return `$${val}`;
    return `$${val.toFixed(2)}`;
  };

  // SVG dimensions
  const height = 220;
  const width = 580;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingY = 20;

  const coords = useMemo(() => {
    if (!chartPoints.length) return [];
    return chartPoints.map((pt, index) => {
      const x = paddingLeft + (index / Math.max(1, chartPoints.length - 1)) * (width - paddingLeft - paddingRight);
      const y = height - paddingY - (pt.value / maxVal) * (height - paddingY * 2);
      return { x, y, ...pt };
    });
  }, [chartPoints, maxVal]);

  // Smooth Bezier spline
  const createSmoothPath = (points) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const pathD = createSmoothPath(coords);
  const areaD = coords.length > 0
    ? `${pathD} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between h-full min-h-[380px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span>Ingresos por Ventas</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            {formatCurrency(data.kpis.totalSales)}
          </h4>
        </div>

        {/* View Switcher */}
        <div className="relative">
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
            className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 py-1.5 pl-3 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
          >
            <option value="Diario">Diario</option>
            <option value="Semanal">Semanal</option>
            <option value="Mensual">Mensual</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-x-auto">
        {chartPoints.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center text-center text-slate-400 p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <span className="text-sm font-semibold text-slate-600 mb-1">Sin historial de ventas</span>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Cuando registres ventas desde el Punto de Venta, la gráfica de ingresos se generará automáticamente aquí a escala proporcional.
            </p>
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-56 select-none overflow-visible"
            >
              <defs>
                <linearGradient id="blueAreaGradProportional" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Dynamic Proportional Grid Lines */}
              {yTicks.map((val, idx) => {
                const y = height - paddingY - (val / maxVal) * (height - paddingY * 2);
                return (
                  <g key={idx}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={width - paddingRight}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="inherit"
                      fontWeight="600"
                    >
                      {formatTickLabel(val)}
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area under curve */}
              <path d={areaD} fill="url(#blueAreaGradProportional)" />

              {/* Spline Path */}
              <path
                d={pathD}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive points */}
              {coords.map((pt, i) => (
                <g
                  key={i}
                  className="cursor-pointer group"
                  onMouseEnter={() => setActivePoint(pt)}
                  onMouseLeave={() => setActivePoint(null)}
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={pt.value > 0 ? "5" : "3"}
                    fill={pt.value > 0 ? "#2563eb" : "#ffffff"}
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    className="transition-all duration-150 group-hover:r-6 group-hover:fill-blue-600"
                  />
                </g>
              ))}
            </svg>

            {/* Floating Tooltip */}
            {activePoint && (
              <div
                className="absolute bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 z-20"
                style={{
                  left: `${(activePoint.x / width) * 100}%`,
                  top: `${(activePoint.y / height) * 100}%`,
                }}
              >
                <div className="text-[10px] text-slate-300 font-normal">{activePoint.date}</div>
                <div className="font-bold text-emerald-400">{formatCurrency(activePoint.value)}</div>
              </div>
            )}

            {/* X Axis Labels */}
            <div className="flex justify-between pl-12 pr-4 mt-2 text-[11px] font-semibold text-slate-400">
              {chartPoints.map((pt, idx) => (
                <span key={idx}>{pt.date}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
