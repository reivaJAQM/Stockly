import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';

export const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  className = '',
  menuClassName = '',
  buttonClassName = '',
  allowCustom = false,
  onAddNew,
  customPlaceholder = 'Escribe nueva categoría...',
  icon: Icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newVal, setNewVal] = useState('');
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value) || {
    value,
    label: value || placeholder
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsAdding(false);
        setNewVal('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsAdding(false);
        setNewVal('');
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleCreateNew = async () => {
    const clean = newVal.trim();
    if (!clean) return;
    if (onAddNew) {
      await onAddNew(clean);
    }
    onChange(clean);
    setNewVal('');
    setIsAdding(false);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/90 active:scale-98 border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-between gap-2.5 transition-all shadow-2xs cursor-pointer w-full ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500/40 bg-white' : ''
          } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
        />
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 top-full mt-1.5 left-0 min-w-[210px] w-full max-h-60 overflow-y-auto bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-900/10 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 ${menuClassName}`}
        >
          {options.length === 0 && !allowCustom && (
            <div className="px-3 py-2 text-xs text-slate-400 text-center">
              No hay opciones
            </div>
          )}

          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${isSelected
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-50/90 hover:text-slate-900'
                  }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 stroke-[2.5]" />}
              </button>
            );
          })}

          {allowCustom && (
            <div className="pt-1 mt-1 border-t border-slate-100">
              {isAdding ? (
                <div className="p-1 space-y-1.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder={customPlaceholder}
                    value={newVal}
                    onChange={(e) => setNewVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateNew();
                      }
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                  />
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setNewVal('');
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateNew}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-xs"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear nueva categoría</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
