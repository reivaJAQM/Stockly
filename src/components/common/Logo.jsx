import React from 'react';

export const Logo = ({ size = 'md', showText = true, className = '', isDark = true }) => {
  // Dimension scales
  const sizes = {
    sm: { icon: 'w-7 h-7', text: 'text-base', subtext: 'text-[9px]' },
    md: { icon: 'w-10 h-10', text: 'text-xl', subtext: 'text-[11px]' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl', subtext: 'text-xs' }
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Minimalist Isometric Geometric Logo Icon */}
      <div className={`relative ${currentSize.icon} flex-shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            {/* Gradients for lighting & depth */}
            <linearGradient id="stocklyGradTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
            <linearGradient id="stocklyGradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="stocklyGradRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#3730a3" />
            </linearGradient>
            <linearGradient id="stocklyGradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* Background Soft Pill Container */}
          <rect width="48" height="48" rx="14" fill="#0f172a" />

          {/* Minimalist Isometric Layered S - Stock & Inventory Geometry */}
          {/* Top Layer */}
          <path
            d="M24 8L36 15L24 22L12 15L24 8Z"
            fill="url(#stocklyGradTop)"
          />
          {/* Left Facet Upper */}
          <path
            d="M12 15L24 22V29L12 22V15Z"
            fill="url(#stocklyGradLeft)"
          />
          {/* Right Facet Upper */}
          <path
            d="M24 22L36 15V22L24 29V22Z"
            fill="url(#stocklyGradRight)"
          />

          {/* Lower Connected Isometric Level forming the 'S' curvature */}
          <path
            d="M24 26L36 33L24 40L12 33L24 26Z"
            fill="url(#stocklyGradTop)"
            opacity="0.9"
          />
          <path
            d="M12 33L24 40V43L12 36V33Z"
            fill="url(#stocklyGradLeft)"
          />
          <path
            d="M24 40L36 33V36L24 43V40Z"
            fill="url(#stocklyGradRight)"
          />

          {/* Minimalist Core Glowing Node */}
          <circle cx="24" cy="24" r="2.5" fill="#ffffff" />
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-extrabold tracking-tight font-sans ${currentSize.text} ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Stock<span className="text-blue-500">ly</span>
            </span>
          </div>
          <span
            className={`font-medium tracking-wide mt-1 ${currentSize.subtext} ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Gestión de Negocio
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
