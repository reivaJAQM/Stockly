import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, Search, Tag, X } from 'lucide-react';

export const CustomSelect = ({
  options = [],
  value,
  onChange,
  onAddNew,
  placeholder = "Seleccionar opción",
  label,
  allowCustom = false,
  customPlaceholder = "Nombre de nueva categoría...",
  icon: Icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCustomValue, setNewCustomValue] = useState('');
  const dropdownRef = useRef(null);
  const newRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsAddingNew(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => 
    (typeof opt === 'object' ? opt.value : opt) === value
  );

  const selectedLabel = selectedOption 
    ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
    : (value || placeholder);

  const filteredOptions = options.filter((opt) => {
    const text = typeof opt === 'object' ? opt.label : opt;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleCreateNew = (e) => {
    e?.preventDefault();
    if (!newCustomValue.trim()) return;
    const cleanName = newCustomValue.trim();
    if (onAddNew) {
      onAddNew(cleanName);
    } else {
      onChange(cleanName);
    }
    onChange(cleanName);
    setNewCustomValue('');
    setIsAddingNew(false);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && <label className="block font-semibold text-slate-700 mb-1 text-xs">{label}</label>}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200 bg-white ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
            : 'border-slate-200 hover:border-slate-300 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="w-4 h-4 text-slate-400" />}
          <span className={value ? 'text-slate-800 font-semibold' : 'text-slate-400 font-normal'}>
            {selectedLabel}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Custom Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-slate-100 shadow-xl py-2 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {options.length > 5 && !isAddingNew && (
            <div className="px-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg text-xs text-slate-500">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent w-full focus:outline-none text-xs text-slate-800"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Creation Field when active */}
          {allowCustom && isAddingNew ? (
            <div className="p-3 bg-slate-50 rounded-xl m-2 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>Nueva Categoría</span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                ref={newRef}
                autoFocus
                type="text"
                placeholder={customPlaceholder}
                value={newCustomValue}
                onChange={(e) => setNewCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateNew(e);
                }}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Guardar Categoría</span>
              </button>
            </div>
          ) : (
            <>
              {/* Options List */}
              <div className="p-1 space-y-0.5 max-h-44 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400 font-medium">
                    No hay categorías aún
                  </div>
                ) : (
                  filteredOptions.map((option, idx) => {
                    const optValue = typeof option === 'object' ? option.value : option;
                    const optLabel = typeof option === 'object' ? option.label : option;
                    const isSelected = optValue === value;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          onChange(optValue);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span>{optLabel}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add New Custom Button at bottom */}
              {allowCustom && (
                <div className="p-1.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(true)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100/80 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Crear nueva categoría</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
