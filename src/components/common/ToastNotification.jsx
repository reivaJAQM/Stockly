import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastNotification = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success' || !toast.type;
  const isError = toast.type === 'error';

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[99999] max-w-md w-[92%] sm:w-full px-2 pointer-events-auto animate-in slide-in-from-top-6 fade-in duration-300">
      <div className={`p-4 sm:p-4.5 rounded-3xl shadow-2xl border flex items-center gap-3.5 backdrop-blur-xl transition-all ${
        isSuccess
          ? 'bg-slate-900/95 border-emerald-500/40 text-white shadow-emerald-500/15 ring-1 ring-emerald-500/30'
          : isError
          ? 'bg-slate-900/95 border-rose-500/40 text-white shadow-rose-500/15 ring-1 ring-rose-500/30'
          : 'bg-slate-900/95 border-blue-500/40 text-white shadow-blue-500/15 ring-1 ring-blue-500/30'
      }`}>
        {/* Prominent Check Icon */}
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
          isSuccess
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            : isError
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
        }`}>
          {isSuccess ? (
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          ) : isError ? (
            <AlertCircle className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <Info className="w-6 h-6 stroke-[2.5]" />
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pr-1">
          <p className="font-extrabold text-sm text-white tracking-tight">
            {toast.title || (isSuccess ? '¡Operación Exitosa!' : 'Atención')}
          </p>
          <p className="text-xs text-slate-300 font-medium mt-0.5 leading-snug truncate">
            {toast.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
