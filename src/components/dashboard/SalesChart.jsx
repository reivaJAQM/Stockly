import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TrendingUp } from 'lucide-react';

export const SalesChart = ({ timeRange = 'today', totalSales }) => {
  const { data, formatCurrency } = useApp();
  const [activePoint, setActivePoint] = useState(null);

  // Helper to format Date safely
  const parseSafeDate = (raw) => {
    if (!raw) return null;
    const str = String(raw);
    const d = new Date(str.length === 10 ? `${str}T12:00:00` : str);
    return isNaN(d.getTime()) ? null : d;
  };

  const getIsoString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Prepare chart points dynamically according to the selected timeRange
  const chartPoints = useMemo(() => {
    const orders = (data.orders || []).filter((o) => o.status !== 'Cancelado');
    const now = new Date();

    // 1. TODAY: Hourly breakdown
    if (timeRange === 'today') {
      const todayIso = getIsoString(now);
      const hoursSlots = [
        { label: '08:00', startH: 0, endH: 8 },
        { label: '10:00', startH: 8, endH: 10 },
        { label: '12:00', startH: 10, endH: 12 },
        { label: '14:00', startH: 12, endH: 14 },
        { label: '16:00', startH: 14, endH: 16 },
        { label: '18:00', startH: 16, endH: 18 },
        { label: '20:00', startH: 18, endH: 20 },
        { label: '22:00', startH: 20, endH: 24 }
      ];

      const hourlyTotals = Array(hoursSlots.length).fill(0);

      orders.forEach((o) => {
        const d = parseSafeDate(o.createdAt || o.date);
        if (!d) return;
        if (getIsoString(d) !== todayIso) return;

        const h = d.getHours();
        const slotIdx = hoursSlots.findIndex((s) => h >= s.startH && h < s.endH);
        if (slotIdx !== -1) {
          hourlyTotals[slotIdx] += Number(o.total || 0);
        } else {
          hourlyTotals[hourlyTotals.length - 1] += Number(o.total || 0);
        }
      });

      return hoursSlots.map((slot, idx) => ({
        date: slot.label,
        value: hourlyTotals[idx]
      }));
    }

    // 2. THIS WEEK: Monday through Sunday of current week
    if (timeRange === 'thisWeek') {
      const result = [];
      const ordersMap = {};
      orders.forEach((o) => {
        const d = parseSafeDate(o.createdAt || o.date);
        if (!d) return;
        const iso = getIsoString(d);
        ordersMap[iso] = (ordersMap[iso] || 0) + Number(o.total || 0);
      });

      const dayOfWeek = now.getDay();
      const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);

      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
        const isoKey = getIsoString(d);
        const dayLabel = d.toLocaleDateString('es-ES', { weekday: 'short' });
        const dateStr = `${dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)} ${d.getDate()}`;
        result.push({
          date: dateStr,
          isoKey,
          value: ordersMap[isoKey] || 0
        });
      }
      return result;
    }

    // 3. THIS MONTH: 6 regular intervals across current month
    if (timeRange === 'thisMonth') {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const monthShort = now.toLocaleDateString('es-ES', { month: 'short' });

      const ordersMap = {};
      orders.forEach((o) => {
        const d = parseSafeDate(o.createdAt || o.date);
        if (!d) return;
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          const dayNum = d.getDate();
          ordersMap[dayNum] = (ordersMap[dayNum] || 0) + Number(o.total || 0);
        }
      });

      const intervals = [
        { label: `1-5 ${monthShort}`, start: 1, end: 5 },
        { label: `6-10 ${monthShort}`, start: 6, end: 10 },
        { label: `11-15 ${monthShort}`, start: 11, end: 15 },
        { label: `16-20 ${monthShort}`, start: 16, end: 20 },
        { label: `21-25 ${monthShort}`, start: 21, end: 25 },
        { label: `26-${daysInMonth} ${monthShort}`, start: 26, end: daysInMonth }
      ];

      return intervals.map((interval) => {
        let sum = 0;
        for (let d = interval.start; d <= interval.end; d++) {
          sum += ordersMap[d] || 0;
        }
        return {
          date: interval.label,
          value: Math.round(sum * 100) / 100
        };
      });
    }

    // 4. THIS YEAR: Months of the current year
    if (timeRange === 'thisYear') {
      const currentYear = now.getFullYear();
      const monthsMap = Array(12).fill(0);

      orders.forEach((o) => {
        const d = parseSafeDate(o.createdAt || o.date);
        if (!d) return;
        if (d.getFullYear() === currentYear) {
          monthsMap[d.getMonth()] += Number(o.total || 0);
        }
      });

      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return monthNames.map((name, idx) => ({
        date: name,
        value: Math.round(monthsMap[idx] * 100) / 100
      }));
    }

    // 5. ALL: Historical monthly trend
    const result = [];
    const monthsMap = {};
    orders.forEach((o) => {
      const d = parseSafeDate(o.createdAt || o.date);
      if (!d) return;
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsMap[ym] = (monthsMap[ym] || 0) + Number(o.total || 0);
    });

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-ES', { month: 'short' });
      result.push({
        date: label.charAt(0).toUpperCase() + label.slice(1),
        value: Math.round((monthsMap[ym] || 0) * 100) / 100
      });
    }
    return result;
  }, [data.orders, timeRange]);

  // Dynamic proportional maximum based on actual points in current view
  const values = chartPoints.map((pt) => Number(pt.value) || 0);
  const highestValue = Math.max(...values, 0);

  const totalPeriodRevenue = useMemo(() => {
    return chartPoints.reduce((sum, pt) => sum + (Number(pt.value) || 0), 0);
  }, [chartPoints]);

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

  const displayTotal = totalSales !== undefined
    ? totalSales
    : (totalPeriodRevenue > 0 ? totalPeriodRevenue : (timeRange === 'all' ? (data.kpis?.totalSales || 0) : 0));

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100/90 shadow-sm flex flex-col justify-between h-full min-h-[380px]">
      {/* Header without internal filter, 100% reactive to top period filter */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span>Ingresos por Ventas</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            {formatCurrency(displayTotal)}
          </h4>
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
