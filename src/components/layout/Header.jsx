import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Search,
  Bell,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Info,
  CheckCheck,
  Trash2,
  Zap,
  ShoppingBag,
  Clock,
  X,
  ExternalLink
} from 'lucide-react';

export const Header = ({ setIsSidebarOpen }) => {
  const {
    data,
    setIsCommandPaletteOpen,
    setIsPOSOpen,
    setActiveTab,
    markNotificationsAsRead,
    markSingleNotificationAsRead,
    clearAllNotifications,
    deleteSingleNotification
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all'); // 'all' | 'unread'

  const allNotifications = data.notifications || [];
  const unreadCount = allNotifications.filter((n) => !n.read).length;

  const displayedNotifications = notifFilter === 'unread'
    ? allNotifications.filter((n) => !n.read)
    : allNotifications;

  const handleNotificationClick = (notif) => {
    // 1. Mark as read
    if (!notif.read) {
      markSingleNotificationAsRead?.(notif.id);
    }

    // 2. Navigate contextually if linkTab is present
    if (notif.linkTab) {
      setActiveTab?.(notif.linkTab);
      setIsNotifOpen(false);
    }
  };

  const getNotifIcon = (notif) => {
    if (notif.type === 'danger' || notif.title?.includes('Agotado')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 fill-rose-500" />
        </div>
      );
    }
    if (notif.type === 'warning' || notif.title?.includes('Bajo')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    }
    if (notif.type === 'success' || notif.title?.includes('Venta')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center flex-shrink-0">
        <Info className="w-4 h-4" />
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Global Search Bar */}
      <div className="flex items-center gap-3 lg:gap-6 flex-1 max-w-2xl">
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search with ⌘K Badge */}
        <div
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full max-w-md flex items-center gap-3 px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-2xl cursor-pointer transition-all duration-200 group text-slate-400 hover:border-slate-300"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          <span className="text-sm font-normal text-slate-500 truncate flex-1">
            Buscar productos, clientes, ventas...
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md shadow-xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions: Quick Button, Notifications */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick New Sale Button */}
        <button
          onClick={() => setIsPOSOpen(true)}
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Venta</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all cursor-pointer ${
              isNotifOpen
                ? 'bg-blue-50/80 border-blue-200 text-blue-700'
                : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/90 text-slate-700'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs font-bold hidden md:inline">Notificaciones</span>
          </button>

          {isNotifOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotifOpen(false)}
              />

              {/* Notification Popover Panel */}
              <div className="absolute right-0 mt-3 w-88 sm:w-[440px] bg-white border border-slate-200/90 rounded-3xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                {/* Header */}
                <div className="p-5 pb-3.5 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-extrabold text-base text-slate-900 tracking-tight">
                        Notificaciones
                      </h4>
                      {unreadCount > 0 ? (
                        <span className="h-5 min-w-[20px] px-2 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center border border-blue-100/80">
                          {unreadCount}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          Al día
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {unreadCount > 0 && (
                        <button
                          onClick={markNotificationsAsRead}
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold px-2.5 py-1.5 rounded-xl hover:bg-blue-50/80 transition-colors cursor-pointer"
                          title="Marcar todas como leídas"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Marcar leídas</span>
                        </button>
                      )}
                      {allNotifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-600 font-medium px-2.5 py-1.5 rounded-xl hover:bg-rose-50/80 transition-colors cursor-pointer"
                          title="Limpiar todas las notificaciones"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Limpiar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Symmetrical Segmented Tabs */}
                  <div className="flex p-1 bg-slate-100/80 rounded-2xl gap-1">
                    <button
                      onClick={() => setNotifFilter('all')}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                        notifFilter === 'all'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Todas ({allNotifications.length})
                    </button>
                    <button
                      onClick={() => setNotifFilter('unread')}
                      className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                        notifFilter === 'unread'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      No leídas ({unreadCount})
                    </button>
                  </div>
                </div>

                {/* Notification List */}
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                  {displayedNotifications.length > 0 ? (
                    displayedNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`px-5 py-3.5 hover:bg-slate-50/80 transition-all flex gap-3.5 group cursor-pointer relative items-start ${
                          !notif.read ? 'bg-blue-50/25' : ''
                        }`}
                      >
                        {/* Icon */}
                        {getNotifIcon(notif)}

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2.5 mt-2 text-[11px] text-slate-400 font-medium">
                            <div className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>{notif.time || 'Reciente'}</span>
                            </div>
                            {notif.linkTab && (
                              <span className="inline-flex items-center gap-1 text-blue-600 font-semibold group-hover:underline">
                                Ver módulo <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Single Dismiss Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSingleNotification?.(notif.id);
                          }}
                          className="absolute top-3.5 right-4 p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Eliminar notificación"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center text-xs text-slate-400 space-y-2.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center mx-auto">
                        <CheckCheck className="w-6 h-6 text-emerald-500" />
                      </div>
                      <p className="font-bold text-slate-800 text-sm">
                        {notifFilter === 'unread'
                          ? '¡Todo al día!'
                          : 'No hay notificaciones'}
                      </p>
                      <p className="text-slate-400 text-xs max-w-xs mx-auto">
                        {notifFilter === 'unread'
                          ? 'No tienes notificaciones pendientes por leer en este momento.'
                          : 'Las alertas de stock bajo y ventas aparecerán aquí.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
