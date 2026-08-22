import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomSelect } from '../common/CustomSelect';
import {
  X,
  Package,
  Barcode,
  TrendingUp,
  Boxes,
  Tag,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Trash2,
  RefreshCw,
  Link as LinkIcon,
  Sparkles
} from 'lucide-react';

export const ProductModal = ({ isOpen, onClose, productToEdit }) => {
  const { addProduct, updateProduct, addCategory, data } = useApp();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    barcode: '',
    costPrice: '',
    sellPrice: '',
    stock: '10',
    minStock: '5',
    image: ''
  });

  // Extract only user-created categories from PostgreSQL table 'categories' + registered products
  const existingCategories = Array.from(
    new Set([
      ...(data.categories || []).map((c) => c.name),
      ...(data.products || []).map((p) => p.category).filter(Boolean)
    ])
  );

  const categoryOptions = existingCategories.map((cat) => ({
    value: cat,
    label: cat
  }));

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        category: productToEdit.category || '',
        sku: productToEdit.sku || '',
        barcode: productToEdit.barcode || '',
        costPrice: productToEdit.costPrice || '',
        sellPrice: productToEdit.sellPrice || '',
        stock: String(productToEdit.stock ?? '0'),
        minStock: String(productToEdit.minStock ?? '5'),
        image: productToEdit.image || ''
      });
      setShowUrlInput(Boolean(productToEdit.image && productToEdit.image.startsWith('http')));
    } else {
      const initialCat = existingCategories[0] || '';
      setFormData({
        name: '',
        category: initialCat,
        sku: '',
        barcode: '',
        costPrice: '',
        sellPrice: '',
        stock: '10',
        minStock: '5',
        image: ''
      });
      setShowUrlInput(false);
    }
  }, [productToEdit, isOpen]);

  const handleAddNewCategory = async (newCat) => {
    if (!newCat.trim()) return;
    const clean = newCat.trim();
    await addCategory(clean);
    setFormData((prev) => ({
      ...prev,
      category: clean
    }));
  };

  // Robust Image Upload Handler with Automatic Dimension Optimization
  const handleFileChange = (file) => {
    if (!file) return;
    const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp|jfif)$/i.test(file.name);
    if (!isImage) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.90);
        setFormData((prev) => ({ ...prev, image: optimizedBase64 }));
      };
      img.onerror = () => {
        setFormData((prev) => ({ ...prev, image: e.target.result }));
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      alert('Error al leer la imagen seleccionada. Por favor inténtalo de nuevo.');
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  if (!isOpen) return null;

  // Real-time Profit Margin Calculation
  const cost = parseFloat(formData.costPrice) || 0;
  const sell = parseFloat(formData.sellPrice) || 0;
  const profitPerUnit = sell > 0 ? sell - cost : 0;
  const marginPercent = sell > 0 ? ((profitPerUnit / sell) * 100).toFixed(1) : 0;
  const isProfitable = profitPerUnit >= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sellPrice) return;

    const payload = {
      ...formData,
      category: formData.category.trim() || 'General',
      costPrice: Number(formData.costPrice || 0),
      sellPrice: Number(formData.sellPrice || 0),
      stock: parseInt(formData.stock || 0, 10),
      minStock: parseInt(formData.minStock || 5, 10)
    };

    if (productToEdit) {
      await updateProduct(productToEdit.id, payload);
    } else {
      await addProduct(payload);
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-auto max-h-[94vh] flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
                <Package className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
                  {productToEdit ? 'Editar Producto' : 'Agregar Nuevo Producto'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Completa los datos del producto para tu catálogo e inventario
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs overflow-y-auto pr-1">
            {/* Section 1: Product Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Nombre del Producto <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ej. Nombre o descripción del artículo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Section 2: Custom Dropdown (Category) */}
            <div>
              <CustomSelect
                label="Categoría"
                options={categoryOptions}
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
                onAddNew={handleAddNewCategory}
                allowCustom={true}
                placeholder={categoryOptions.length === 0 ? "Crear primera categoría" : "Seleccionar o crear categoría"}
                customPlaceholder="Escribe el nombre de la categoría..."
                icon={Tag}
              />
            </div>

            {/* Section 3: SKU & Barcode (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700">
                    Código SKU <span className="text-slate-400 font-normal text-[11px]">(Opcional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const prefix = formData.category ? formData.category.substring(0, 3).toUpperCase() : 'PRD';
                      setFormData({ ...formData, sku: `${prefix}-${Math.floor(1000 + Math.random() * 9000)}` });
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Sparkles className="w-3 h-3" /> Generar SKU
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Ej. SKU-1001 (Opcional)"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-mono placeholder:text-slate-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700">
                    Código de Barras <span className="text-slate-400 font-normal text-[11px]">(Opcional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, barcode: `750100${Math.floor(100000 + Math.random() * 900000)}` });
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Sparkles className="w-3 h-3" /> Generar Barra
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ej. 750100998811 (Opcional)"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-mono placeholder:text-slate-400"
                  />
                  <Barcode className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Section 4: Prices & Profit Margin Indicator */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Precio de Costo ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Precio de Venta ($) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={formData.sellPrice}
                      onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>

              {/* Live Profit Margin Calculation Banner */}
              {sell > 0 && (
                <div className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold ${
                  isProfitable ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' : 'bg-rose-50 text-rose-800 border border-rose-200/60'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>Ganancia estimada por unidad: <strong>${profitPerUnit.toFixed(2)}</strong></span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-white shadow-2xs text-[11px] font-bold">
                    {marginPercent}% Margen
                  </span>
                </div>
              )}
            </div>

            {/* Section 5: Stock & Min Stock Alert */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stock Inicial (Unidades)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Boxes className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stock Mínimo (Alerta)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    placeholder="5"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <AlertCircle className="w-4 h-4 text-amber-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Section 6: Real Image File Uploader */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700">Foto del Producto (Opcional)</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>{showUrlInput ? 'Subir desde PC' : 'Pegar URL web'}</span>
                  </button>
                </div>
              </div>

              {/* Native file input */}
              <input
                id="product-image-file-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />

              {showUrlInput ? (
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/foto-producto.jpg"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                  />
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-xs"
                    />
                  )}
                </div>
              ) : formData.image ? (
                /* Uploaded Image Preview Card */
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-xs flex-shrink-0 bg-white"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">Foto cargada</p>
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Lista para guardar
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <label
                      htmlFor="product-image-file-input"
                      className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 font-semibold text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <RefreshCw className="w-3 h-3 text-slate-500" />
                      <span>Cambiar Foto</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Native Accessible Drag and Drop Label */
                <label
                  htmlFor="product-image-file-input"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-6 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center block ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/80 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 mx-auto">
                    <UploadCloud className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <p className="font-bold text-slate-800 text-xs">
                    Haz clic para seleccionar o arrastra la foto de tu producto
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Formatos soportados: PNG, JPG, JPEG, WEBP
                  </p>
                </label>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{productToEdit ? 'Guardar Cambios' : 'Crear Producto'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
