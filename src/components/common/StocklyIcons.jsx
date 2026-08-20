import React from 'react';

// =======================================================================
// SISTEMA DE ICONOS PERSONALIZADO STOCKLY: DUOTONO DE PRECISIÓN SEMÁNTICA
// Metáforas 100% reconocibles al instante + Técnica visual propietaria
// (Capa de volumen translúcido + Trazos vectoriales de precisión + Acento de luz)
// =======================================================================

// 1. DASHBOARD / TABLERO PRINCIPAL
// Metáfora: Tablero de métricas de 4 cuadrantes con widget destacado
export const IconDashboard = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Fondo duotono en cuadrante principal */}
    <rect x="3" y="3" width="8" height="8" rx="2.5" fill="currentColor" fillOpacity="0.25" />
    <rect x="3" y="3" width="8" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="13" y="3" width="8" height="5" rx="2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="13" y="10" width="8" height="11" rx="2.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="3" y="13" width="8" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* Micro acento interno */}
    <circle cx="7" cy="7" r="1" fill="currentColor" />
  </svg>
);

// 2. PRODUCTOS / CATÁLOGO
// Metáfora: Etiqueta de producto de venta con estrella/precio
export const IconProducts = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Cuerpo de la etiqueta en duotono */}
    <path
      d="M12.5 2H6C4.89543 2 4 2.89543 4 4V10.5C4 11.0304 4.21071 11.5391 4.58579 11.9142L12.5858 19.9142C13.3668 20.6953 14.6332 20.6953 15.4142 19.9142L20.4142 14.9142C21.1953 14.1332 21.1953 12.8668 20.4142 12.0858L12.4142 4.08579C12.0391 3.71071 11.5304 3.5 11 3.5"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <path
      d="M12 2.5H6C4.61929 2.5 3.5 3.61929 3.5 5V11C3.5 11.663 3.76339 12.2989 4.23223 12.7678L12.7322 21.2678C13.7085 22.2441 15.2915 22.2441 16.2678 21.2678L21.2678 16.2678C22.2441 15.2915 22.2441 13.7085 21.2678 12.7322L12.7678 4.23223C12.2989 3.76339 11.663 3.5 11 3.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Ojal de la etiqueta */}
    <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
  </svg>
);

// 3. INVENTARIO / ALMACÉN DE STOCK
// Metáfora: Cajas apiladas de mercancía en almacén
export const IconInventory = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Caja superior */}
    <path d="M12 2L20 6.5L12 11L4 6.5L12 2Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 6.5V11.5L12 16L20 11.5V6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    {/* Base de cajas apiladas */}
    <path d="M4 12.5V17.5L12 22L20 17.5V12.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 11V22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// 4. VENTAS / TERMINAL POS
// Metáfora: Ticket de compra con código de barras y total
export const IconSales = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Ticket de venta en duotono */}
    <path
      d="M5 3C4.44772 3 4 3.44772 4 4V20.5L6.5 19L9 20.5L11.5 19L14 20.5L16.5 19L19 20.5L20 19.5V4C20 3.44772 19.5523 3 19 3H5Z"
      fill="currentColor"
      fillOpacity="0.2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Líneas de detalle y monto */}
    <path d="M8 7H16M8 10.5H13M8 14H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="16" cy="10.5" r="1" fill="currentColor" />
  </svg>
);

// 5. GASTOS / EGRESOS
// Metáfora: Billetera con billete/tarjeta y flecha de salida
export const IconExpenses = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Billetera duotono */}
    <rect x="3" y="6" width="18" height="14" rx="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M3 10H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* Broche / Moneda */}
    <rect x="15" y="12" width="6" height="5" rx="1.5" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="17.5" cy="14.5" r="0.75" fill="currentColor" />
    {/* Salida de dinero superior */}
    <path d="M7 6V4C7 3.44772 7.44772 3 8 3H16C16.5523 3 17 3.44772 17 4V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// 6. CLIENTES / DIRECTORIO
// Metáfora: Dos personas / Comunidad de clientes
export const IconCustomers = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Usuario Principal */}
    <circle cx="9" cy="7" r="3.5" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.8" />
    <path d="M2.5 19C2.5 15.5 5.5 13.5 9 13.5C12.5 13.5 15.5 15.5 15.5 19" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* Usuario Secundario */}
    <path d="M16 4C17.6569 4 19 5.34315 19 7C19 8.65685 17.6569 10 16 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M17.5 13.5C19.5 14.5 21.5 16 21.5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// 7. PROVEEDORES / LOGÍSTICA
// Metáfora: Camión de reparto de mercancía
export const IconSuppliers = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Caja de carga del camión */}
    <rect x="2" y="5" width="13" height="11" rx="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* Cabina del camión */}
    <path d="M15 9H18.5L21.5 12.5V16H15V9Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    {/* Ruedas */}
    <circle cx="6.5" cy="18.5" r="2" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="17.5" cy="18.5" r="2" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

// 8. REPORTES / ANALÍTICA
// Metáfora: Gráfica de barras ascendente con línea de crecimiento
export const IconReports = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Barras de estadísticas */}
    <rect x="3" y="14" width="4.5" height="7" rx="1.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" />
    <rect x="9.75" y="9" width="4.5" height="12" rx="1.5" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1.8" />
    <rect x="16.5" y="4" width="4.5" height="17" rx="1.5" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1.8" />
    {/* Línea de tendencia ascendente */}
    <path d="M4 11L10 6L14 8.5L20 2.5M20 2.5H16M20 2.5V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 9. DESCUENTOS / PROMOCIONES
// Metáfora: Ticket de descuento con porcentaje (%)
export const IconDiscounts = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="5" width="18" height="14" rx="3" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* Porcentaje */}
    <circle cx="9" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="15" cy="14.5" r="1.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M16 8L8 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// 10. CONFIGURACIÓN / AJUSTES
// Metáfora: Engranaje de precisión con núcleo de control
export const IconSettings = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 11. KPI: Bóveda / Dinero de Ventas Totales
export const IconKPISales = ({ size = 26, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" />
    <path d="M12 6V18M14.5 9H10.5C9.67157 9 9 9.67157 9 10.5C9 11.3284 9.67157 12 10.5 12H13.5C14.3284 12 15 12.6716 15 13.5C15 14.3284 14.3284 15 13.5 15H9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 12. KPI: Bolsa de Compra / Órdenes
export const IconKPIOrders = ({ size = 26, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M6 2L3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6L18 2H6Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 13. KPI: Usuarios / Clientes Nuevos
export const IconKPICustomers = ({ size = 26, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="9" cy="7" r="4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" />
    <path d="M2 21V19C2 15.6863 4.68629 13 8 13H10C13.3137 13 16 15.6863 16 19V21" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M19 8V14M16 11H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 14. KPI: Caja de Producto / Unidades Vendidas
export const IconKPIProducts = ({ size = 26, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 12L21 7M12 12L3 7M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.5 4.5L16.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
