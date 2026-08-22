import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  MessageCircle,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  Smartphone,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const WhatsAppSettings = () => {
  const [status, setStatus] = useState('DISCONNECTED'); // DISCONNECTED | SCAN_QR | CONNECTING | CONNECTED
  const [qrCode, setQrCode] = useState(null);
  const [connectedInfo, setConnectedInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchStatus = async () => {
    try {
      const data = await api.getWhatsAppStatus();
      setStatus(data.status);
      setQrCode(data.qrCode);
      setConnectedInfo(data.connectedInfo);
      if (data.lastError) setErrorMsg(data.lastError);
    } catch (err) {
      console.error('Error fetching WhatsApp status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Poll status every 3 seconds while connecting or scanning QR
    const interval = setInterval(() => {
      fetchStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleStartConnection = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await api.initWhatsApp();
      await fetchStatus();
    } catch (err) {
      setErrorMsg(err.message || 'Error al iniciar conexión de WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('¿Deseas desconectar WhatsApp?')) return;
    setIsLoading(true);
    try {
      await api.disconnectWhatsApp();
      setStatus('DISCONNECTED');
      setQrCode(null);
      setConnectedInfo(null);
    } catch (err) {
      setErrorMsg(err.message || 'Error al desconectar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Conexión de WhatsApp en Segundo Plano</h3>
            <p className="text-xs text-slate-500 font-medium">
              Envía tickets y facturas automáticamente sin necesidad de abrir ventanas en tu navegador.
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {status === 'CONNECTED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Conectado
            </span>
          )}
          {status === 'SCAN_QR' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Esperando escaneo de QR
            </span>
          )}
          {status === 'CONNECTING' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              Iniciando servicio...
            </span>
          )}
          {status === 'DISCONNECTED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
              Desconectado
            </span>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Content depending on status */}
      {status === 'CONNECTED' ? (
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-emerald-950">¡WhatsApp Vinculado y Listo!</h4>
                <p className="text-xs text-emerald-800 font-medium">
                  Número activo: <span className="font-bold font-mono">+{connectedInfo?.phone || 'Ecuador'}</span> ({connectedInfo?.name || 'Tu Negocio'})
                </p>
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Desconectar</span>
            </button>
          </div>

          <div className="pt-3 border-t border-emerald-200/60 text-xs text-emerald-800 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              Cada vez que hagas una venta, al presionar <strong>"Enviar por WhatsApp"</strong> el ticket llegará al cliente al instante en segundo plano.
            </span>
          </div>
        </div>
      ) : status === 'SCAN_QR' && qrCode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xs border border-slate-200">
            <img
              src={qrCode}
              alt="Código QR de WhatsApp"
              className="w-56 h-56 rounded-xl object-contain"
            />
            <p className="text-[11px] font-bold text-slate-500 mt-2 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" />
              Actualizando código en tiempo real
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Pasos para conectar:
            </h4>
            <ol className="list-decimal list-inside space-y-2 font-medium">
              <li>Abre <strong>WhatsApp</strong> en tu teléfono.</li>
              <li>Toca <strong>Ajustes</strong> o <strong>Menú (tres puntos)</strong>.</li>
              <li>Selecciona <strong>Dispositivos vinculados</strong> y luego <strong>Vincular un dispositivo</strong>.</li>
              <li>Apunta tu teléfono hacia este código QR para escanearlo.</li>
            </ol>
            <p className="text-[11px] text-slate-400 mt-2 italic">
              La sesión se almacena de forma segura en tu servidor local. Solo necesitas escanearlo una sola vez.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center shadow-2xs">
            <QrCode className="w-6 h-6 text-emerald-600" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">Vincular WhatsApp de tu Negocio</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Genera un código QR para conectar tu cuenta de WhatsApp y comenzar a enviar tickets automáticamente a tus clientes.
          </p>
          <button
            onClick={handleStartConnection}
            disabled={isLoading || status === 'CONNECTING'}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all inline-flex items-center gap-2"
          >
            {isLoading || status === 'CONNECTING' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generando código QR...</span>
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                <span>Generar Código QR para Vincular</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
