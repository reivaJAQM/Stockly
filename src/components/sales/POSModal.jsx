import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Banknote,
  ArrowRightLeft,
  HandCoins,
  AlertCircle,
  User,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  ChevronDown,
  Check,
  Zap,
  Tag,
  UserPlus,
  Phone,
  Mail
} from 'lucide-react';

export const POSModal = ({ isOpen, onClose }) => {
  const { data, createSale, formatCurrency, setSelectedReceiptOrder, showToast, setIsServiceModalOpen, addCustomer, addService, deleteService } = useApp();

  const [cart, setCart] = useState([]);
  const [posTab, setPosTab] = useState('products'); // 'products' | 'services'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null); // null = Cliente Mostrador by default
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [cashGiven, setCashGiven] = useState('');
  const [initialPayment, setInitialPayment] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Quick create service modal state (Persists in PostgreSQL catalog)
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('Servicios');

  // Quick new customer modal state
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  if (!isOpen) return null;

  const categories = ['all', ...Array.from(new Set((data.products || []).map((p) => p.category).filter(Boolean)))];
  const serviceCategories = ['all', ...Array.from(new Set((data.services || []).map((s) => s.category).filter(Boolean)))];

  const filteredProducts = (data.products || []).filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.barcode && p.barcode.includes(searchTerm));
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const filteredServices = (data.services || []).filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Cart operations
  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id && !item.isService);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Cannot exceed stock
        return prev.map((item) =>
          item.productId === product.id && !item.isService
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `prd_${product.id}`,
          productId: product.id,
          isService: false,
          name: product.name,
          price: Number(product.sellPrice || 0),
          image: product.image,
          category: product.category,
          quantity: 1,
          maxStock: product.stock
        }
      ];
    });
  };

  const addServiceToCart = (service, priceOverride = null) => {
    const finalPrice = priceOverride !== null ? Number(priceOverride) : Number(service.defaultPrice || 0);
    const cartItemId = `srv_${service.id || Date.now()}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.isService && item.serviceId === service.id);
      if (existing) {
        return prev.map((item) =>
          item.isService && item.serviceId === service.id
            ? { ...item, quantity: item.quantity + 1, price: finalPrice > 0 ? finalPrice : item.price }
            : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          serviceId: service.id || null,
          isService: true,
          productId: null,
          name: service.name,
          price: finalPrice,
          category: service.category || 'Servicios',
          quantity: 1,
          maxStock: 999999
        }
      ];
    });
  };

  const handleCreateServiceFromPOS = async (e) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    try {
      const created = await addService({
        name: newServiceName.trim(),
        category: newServiceCategory.trim() || 'Servicios',
        defaultPrice: 0 // Sin precio fijo; el precio se ingresa al momento de cobrar
      });

      const serviceToAdd = created || {
        id: Date.now(),
        name: newServiceName.trim(),
        category: newServiceCategory.trim() || 'Servicios',
        defaultPrice: 0
      };

      // Agregar inmediatamente al ticket actual
      addServiceToCart(serviceToAdd, 0);

      setNewServiceName('');
      setNewServiceCategory('Servicios');
      setShowCreateServiceModal(false);
    } catch (err) {
      console.error('Error creating service from POS:', err);
    }
  };

  const handleCreateCustomerFromPOS = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim()) return;

    try {
      const created = await addCustomer(newCustomerForm);
      if (created) {
        setSelectedCustomer(created);
      } else {
        setSelectedCustomer({
          name: newCustomerForm.name.trim(),
          phone: newCustomerForm.phone.trim(),
          email: newCustomerForm.email.trim(),
          notes: newCustomerForm.notes.trim()
        });
      }
      setNewCustomerForm({ name: '', phone: '', email: '', notes: '' });
      setShowNewCustomerModal(false);
      setIsCustomerDropdownOpen(false);
      setCustomerSearchQuery('');
    } catch (err) {
      console.error('Error creating customer from POS:', err);
    }
  };

  const updateQuantity = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          const match = item.id === itemId || item.productId === itemId;
          if (match) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.maxStock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const updateItemPrice = (itemId, newPrice) => {
    const parsed = Math.max(0, parseFloat(newPrice) || 0);
    setCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, price: parsed } : item))
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId && item.productId !== itemId));
  };

  // Calculations (No tax added - direct product pricing)
  const rawSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (rawSubtotal * discountPercent) / 100;
  const grandTotal = Math.max(0, rawSubtotal - discountAmount);
  const taxAmount = 0;
  const cashChange = Number(cashGiven) > grandTotal ? Number(cashGiven) - grandTotal : 0;

  const numInitialPayment = (paymentMethod === 'Crédito' || paymentMethod === 'Crédito / Fiado') ? Math.min(grandTotal, Math.max(0, Number(initialPayment || 0))) : grandTotal;
  const creditBalanceDue = (paymentMethod === 'Crédito' || paymentMethod === 'Crédito / Fiado') ? Math.max(0, grandTotal - numInitialPayment) : 0;

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;

    if ((paymentMethod === 'Crédito' || paymentMethod === 'Crédito / Fiado') && (!selectedCustomer || !selectedCustomer.id)) {
      showToast({
        type: 'error',
        title: 'Cliente Requerido',
        message: 'Debes seleccionar o crear un cliente arriba para poder vender a crédito.'
      });
      setIsCustomerDropdownOpen(true);
      return;
    }

    const salePayload = {
      customer: selectedCustomer
        ? { id: selectedCustomer.id, name: selectedCustomer.name, email: selectedCustomer.email, phone: selectedCustomer.phone }
        : { id: null, name: "Cliente Mostrador", email: "general@cliente.com", phone: "N/A" },
      total: grandTotal,
      subtotal: rawSubtotal,
      tax: 0,
      discount: discountAmount,
      paymentMethod,
      initialPayment: (paymentMethod === 'Crédito' || paymentMethod === 'Crédito / Fiado') ? numInitialPayment : grandTotal,
      cashGiven: paymentMethod === 'Efectivo' && Number(cashGiven) > 0 ? Number(cashGiven) : null,
      cashChange: paymentMethod === 'Efectivo' && Number(cashGiven) > 0 ? cashChange : 0,
      channel: 'Venta Directa',
      items: cart.map((i) => ({
        productId: i.productId || null,
        serviceId: i.serviceId || null,
        isService: !!i.isService,
        name: i.name,
        quantity: Number(i.quantity),
        price: Number(i.price)
      }))
    };

    try {
      const newOrder = await createSale(salePayload);
      setCart([]);
      setCashGiven('');
      setInitialPayment('');
      onClose();
      // Open receipt modal with the REAL resolved order object
      if (newOrder) {
        setSelectedReceiptOrder(newOrder);
      }
    } catch (err) {
      console.error('Error creating sale from POS:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-slate-100 rounded-3xl max-w-6xl w-full h-[92vh] flex flex-col lg:flex-row shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        
        {/* LEFT COLUMN: Products / Services Catalog with Stockly Search & Filters */}
        <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/50">
          
          {/* Header Bar with Tab Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
                Punto de Venta
              </h3>
              <p className="text-xs text-slate-400 font-medium">Selecciona productos o servicios para cobrar</p>
            </div>

            {/* Switcher: Productos vs Servicios */}
            <div className="flex items-center bg-slate-200/80 p-1 rounded-2xl border border-slate-200 text-xs font-bold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setPosTab('products');
                  setSelectedCategory('all');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  posTab === 'products'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Productos ({data.products?.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPosTab('services');
                  setSelectedCategory('all');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  posTab === 'services'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Servicios ({data.services?.length || 0})</span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex-shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={posTab === 'products' ? "Buscar producto por nombre, SKU o código..." : "Buscar servicio..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 shadow-2xs"
            />
          </div>

          {/* Category Pills Selector */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar">
            {(posTab === 'products' ? categories : serviceCategories).map((c) => {
              const isActive = selectedCategory === c;
              const label = c === 'all' ? (posTab === 'products' ? 'Todos los productos' : 'Todos los servicios') : c;
              const count = posTab === 'products'
                ? (c === 'all' ? data.products.length : data.products.filter((p) => p.category === c).length)
                : (c === 'all' ? (data.services || []).length : (data.services || []).filter((s) => s.category === c).length);

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategory(c)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-600'
                      : 'bg-white text-slate-600 hover:bg-slate-100/90 border border-slate-200/80 hover:border-slate-300 shadow-2xs'
                    }`}
                >
                  {posTab === 'products' ? (
                    c === 'all' ? <Layers className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  )}
                  <span>{label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Quick create service button when in services tab */}
            {posTab === 'services' && (
              <button
                type="button"
                onClick={() => {
                  setNewServiceName(searchTerm.trim());
                  setNewServiceCategory('Servicios');
                  setShowCreateServiceModal(true);
                }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-amber-600" />
                <span>Nuevo Servicio</span>
              </button>
            )}
          </div>

          {/* Catalog Grid */}
          <div className="flex-1 overflow-y-auto mt-3 pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3.5 content-start auto-rows-max">
            {/* PRODUCTS TAB GRID */}
            {posTab === 'products' && (
              <>
                {filteredProducts.map((product) => {
                  const inCartItem = cart.find((i) => !i.isService && i.productId === product.id);
                  const isOut = product.stock <= 0;

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOut && addToCart(product)}
                      className={`bg-white p-3 rounded-2xl border transition-all duration-200 flex flex-col cursor-pointer group relative ${isOut
                          ? 'opacity-50 cursor-not-allowed border-slate-200'
                          : inCartItem
                            ? 'border-blue-500 shadow-md ring-1 ring-blue-500/30'
                            : 'border-slate-200/80 hover:border-blue-400 hover:shadow-md active:scale-98'
                        }`}
                    >
                      {inCartItem && (
                        <span className="absolute top-2 right-2 z-10 px-2 py-0.5 bg-blue-600 text-white font-extrabold text-[10px] rounded-full shadow-md">
                          {inCartItem.quantity} en ticket
                        </span>
                      )}

                      <div className="w-full h-32 bg-slate-50/80 rounded-xl flex items-center justify-center p-2 overflow-hidden border border-slate-100 group-hover:border-blue-100 transition-colors mb-2">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200 drop-shadow-2xs"
                          />
                        ) : (
                          <Package className="w-9 h-9 text-slate-300" />
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          {product.category || 'General'}
                        </span>
                        <h5 className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors mt-0.5" title={product.name}>
                          {product.name}
                        </h5>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
                        <div>
                          <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                            {formatCurrency(product.sellPrice)}
                          </span>
                          <span className={`text-[10px] font-semibold ${product.stock <= 5 ? 'text-rose-500' : 'text-slate-400'}`}>
                            Stock: {product.stock}
                          </span>
                        </div>

                        <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 text-center">
                    <Package className="w-10 h-10 mb-2 text-slate-300" />
                    <p className="font-bold text-sm text-slate-700">No se encontraron productos</p>
                    <p className="text-xs text-slate-400 mt-0.5">Prueba buscando con otro término o categoría.</p>
                  </div>
                )}
              </>
            )}

            {/* SERVICES TAB GRID */}
            {posTab === 'services' && (
              <>
                {filteredServices.map((service) => {
                  const inCartItem = cart.find((i) => i.isService && i.serviceId === service.id);
                  const hasPrice = Number(service.defaultPrice || 0) > 0;

                  return (
                    <div
                      key={service.id}
                      onClick={() => addServiceToCart(service)}
                      className={`bg-white p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer group relative ${
                        inCartItem
                          ? 'border-amber-500 shadow-md ring-1 ring-amber-500/30'
                          : 'border-slate-200/80 hover:border-amber-400 hover:shadow-md active:scale-98'
                      }`}
                    >
                      {inCartItem && (
                        <span className="absolute top-2 right-2 z-10 px-2 py-0.5 bg-amber-600 text-white font-extrabold text-[10px] rounded-full shadow-md">
                          {inCartItem.quantity} en ticket
                        </span>
                      )}

                      {/* Delete Service Button on Hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`¿Estás seguro de eliminar el servicio "${service.name}" del catálogo?`)) {
                            deleteService(service.id);
                          }
                        }}
                        className="absolute top-2 left-2 z-10 w-6 h-6 rounded-lg bg-white/95 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-slate-200 shadow-2xs cursor-pointer"
                        title="Eliminar este servicio del catálogo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      <div>
                        <div className="w-full h-24 bg-amber-50/60 rounded-xl flex items-center justify-center p-2 overflow-hidden border border-amber-100/80 group-hover:border-amber-200 transition-colors mb-2">
                          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                            <Zap className="w-7 h-7 fill-amber-500 text-amber-500" />
                          </div>
                        </div>

                        <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                          {service.category || 'Servicios'}
                        </span>
                        <h5 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-amber-700 transition-colors mt-0.5" title={service.name}>
                          {service.name}
                        </h5>
                      </div>

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                        <div>
                          {hasPrice ? (
                            <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                              {formatCurrency(service.defaultPrice)}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md block">
                              Monto variable
                            </span>
                          )}
                        </div>

                        <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredServices.length === 0 && (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 text-center">
                    <Zap className="w-10 h-10 mb-2 text-amber-300 fill-amber-300" />
                    <p className="font-bold text-sm text-slate-700">No hay servicios registrados</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Usa el botón "+ Nuevo Servicio" de la barra superior para agregarlos a tu catálogo.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Cart, Checkout & Payment */}
        <div className="w-full lg:w-96 bg-white flex flex-col justify-between p-4 lg:p-6 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Ticket de Venta
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  {cart.reduce((s, i) => s + i.quantity, 0)} unidades seleccionadas
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Proprietary Stockly Customer Selector with Search by Name */}
          <div className="my-3 flex-shrink-0 relative">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Cliente</label>
            
            {/* Trigger Pill */}
            <button
              type="button"
              onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
              className="w-full flex items-center justify-between gap-2.5 p-2 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 text-left transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                  selectedCustomer
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {selectedCustomer ? (
                    selectedCustomer.name.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-extrabold text-slate-900 truncate">
                    {selectedCustomer ? selectedCustomer.name : 'Cliente Mostrador (Venta Rápida)'}
                  </span>
                </div>
              </div>

              <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                isCustomerDropdownOpen ? 'rotate-180 text-blue-600' : ''
              }`} />
            </button>

            {/* Custom Floating Dropdown Menu */}
            {isCustomerDropdownOpen && (
              <>
                {/* Backdrop closer */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCustomerDropdownOpen(false)}
                />

                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 space-y-2 animate-in fade-in zoom-in-95 max-h-64 flex flex-col">
                  {/* Search Input & Quick Create Button */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Buscar por nombre..."
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCustomerForm({
                          name: customerSearchQuery.trim(),
                          phone: '',
                          email: '',
                          notes: ''
                        });
                        setShowNewCustomerModal(true);
                      }}
                      className="p-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 flex-shrink-0"
                      title="Crear un nuevo cliente"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px]">Nuevo</span>
                    </button>
                  </div>

                  {/* List of Customers (Name Only) */}
                  <div className="overflow-y-auto space-y-1 flex-1 max-h-48 pr-0.5">
                    {/* Default Option: Cliente Mostrador */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setIsCustomerDropdownOpen(false);
                        setCustomerSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                        !selectedCustomer
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-xs flex-shrink-0">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="truncate">Cliente Mostrador (Venta Rápida)</span>
                      </div>
                      {!selectedCustomer && (
                        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </button>

                    {/* Filtered Customer list */}
                    {(data.customers || [])
                      .filter((c) =>
                        c.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
                      )
                      .map((cust) => {
                        const isSelected = selectedCustomer?.id === cust.id;
                        return (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setIsCustomerDropdownOpen(false);
                              setCustomerSearchQuery('');
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black flex-shrink-0">
                                {cust.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="truncate">
                                <span className="block truncate">{cust.name}</span>
                                {cust.phone && (
                                  <span className="text-[10px] text-slate-400 font-normal block">{cust.phone}</span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}

                    {(data.customers || []).filter((c) =>
                      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="text-center py-3 px-2">
                        <p className="text-[11px] text-slate-400 font-medium mb-2">
                          {customerSearchQuery.trim()
                            ? `No se encontró "${customerSearchQuery}"`
                            : 'No hay clientes registrados'}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setNewCustomerForm({
                              name: customerSearchQuery.trim(),
                              phone: '',
                              email: '',
                              notes: ''
                            });
                            setShowNewCustomerModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Crear "{customerSearchQuery.trim() || 'Nuevo Cliente'}"</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-1">
            {cart.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-colors gap-2 ${
                  item.isService
                    ? 'bg-amber-50/40 border-amber-200/80 hover:border-amber-300'
                    : 'bg-slate-50/80 border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl border p-1 flex-shrink-0 flex items-center justify-center overflow-hidden ${
                    item.isService ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-white border-slate-200/70'
                  }`}>
                    {item.isService ? (
                      <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
                    ) : item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h6 className="font-bold text-xs text-slate-800 truncate">{item.name}</h6>
                      {item.isService && (
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-black text-[9px] uppercase">
                          Servicio
                        </span>
                      )}
                    </div>

                    {item.isService ? (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[11px] font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price === 0 ? '' : item.price}
                          placeholder="0.00"
                          onChange={(e) => updateItemPrice(item.id, e.target.value)}
                          className="w-20 px-1.5 py-0.5 bg-white border border-amber-300 rounded-lg text-xs font-extrabold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                          title="Clic para editar precio del servicio"
                        />
                        <span className="text-[10px] text-slate-400 font-medium">c/u</span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-extrabold text-blue-600 block">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Buttons */}
                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-extrabold text-slate-900 w-4 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    disabled={item.quantity >= item.maxStock}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${item.quantity >= item.maxStock
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Quitar item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-center px-4">
                <ShoppingCart className="w-8 h-8 mb-2 opacity-30 text-slate-400" />
                <p className="font-bold text-xs text-slate-600">El ticket está vacío</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Haz clic en productos o servicios para agregarlos.</p>
              </div>
            )}
          </div>

          {/* Payment Method Selector & Totals */}
          <div className="pt-3 border-t border-slate-100 space-y-3 flex-shrink-0">
            {/* Payment Method Tabs (Efectivo, Transferencia, Crédito / Fiado) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Método / Condición de Pago</label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Efectivo')}
                  className={`py-2 px-2 rounded-2xl font-bold border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-center ${
                    paymentMethod === 'Efectivo'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs ring-1 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Transferencia')}
                  className={`py-2 px-2 rounded-2xl font-bold border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-center ${
                    paymentMethod === 'Transferencia'
                      ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-xs ring-1 ring-purple-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                  <span>Transfer.</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('Crédito');
                    if (!selectedCustomer) {
                      setIsCustomerDropdownOpen(true);
                    }
                  }}
                  className={`py-2 px-2 rounded-2xl font-bold border flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-center ${
                    paymentMethod === 'Crédito' || paymentMethod === 'Crédito / Fiado'
                      ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs ring-1 ring-amber-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <HandCoins className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>Crédito</span>
                </button>
              </div>
            </div>

            {/* Crédito Calculator Panel */}
            {(paymentMethod === 'Crédito' || paymentMethod === 'Crédito / Fiado') && (
              <div className="space-y-2 p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-[11px]">
                    <HandCoins className="w-3.5 h-3.5 text-amber-600" />
                    <span>Venta a Crédito</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                    selectedCustomer ? 'bg-amber-200/70 text-amber-900' : 'bg-rose-100 text-rose-700 animate-pulse'
                  }`}>
                    {selectedCustomer ? `Cliente: ${selectedCustomer.name}` : 'Falta seleccionar cliente'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Abono Inicial <span className="font-normal text-slate-400">(Opcional)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="$0.00 (Sin abono)"
                      value={initialPayment}
                      onChange={(e) => setInitialPayment(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-rose-700 mb-0.5">Saldo por Cobrar</label>
                    <div className="px-3 py-1.5 bg-rose-600 rounded-xl text-xs font-extrabold text-white text-center shadow-xs">
                      {formatCurrency(creditBalanceDue)}
                    </div>
                  </div>
                </div>

                {/* Quick Abono Buttons */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setInitialPayment('0')}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
                  >
                    $0 (Sin abono inicial)
                  </button>
                  {grandTotal > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setInitialPayment(String((grandTotal * 0.25).toFixed(2)))}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
                      >
                        25%
                      </button>
                      <button
                        type="button"
                        onClick={() => setInitialPayment(String((grandTotal * 0.5).toFixed(2)))}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
                      >
                        50%
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Quick Cash calculator if Efectivo is selected */}
            {paymentMethod === 'Efectivo' && (
              <div className="space-y-1.5 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200/60">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Efectivo entregado</label>
                    <input
                      type="number"
                      placeholder="Monto..."
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  {Number(cashGiven) > 0 && (
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Vuelto / Cambio</label>
                      <div className="px-3 py-1.5 bg-emerald-600 rounded-xl text-xs font-extrabold text-white text-center shadow-xs">
                        {formatCurrency(cashChange)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick bill buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  {[5, 10, 20].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => setCashGiven(String(bill))}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                    >
                      ${bill}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      if (grandTotal <= 0) {
                        setCashGiven('0');
                      } else {
                        // Set exactly the total amount without rounding up
                        const formatted = Number.isInteger(grandTotal)
                          ? String(grandTotal)
                          : grandTotal.toFixed(2);
                        setCashGiven(formatted);
                      }
                    }}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 hover:bg-emerald-200 transition-colors ml-auto shadow-2xs cursor-pointer"
                    title="Asignar el monto exacto del total a cobrar"
                  >
                    Exacto
                  </button>
                </div>
              </div>
            )}

            {/* Totals Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="flex justify-between font-medium">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items):</span>
                <span className="font-bold text-slate-900">{formatCurrency(rawSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[11px] text-emerald-600 font-semibold">
                  <span>Descuento ({discountPercent}%):</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Total a Cobrar:</span>
                <span className="text-blue-600 text-base font-black">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              disabled={cart.length === 0}
              onClick={handleCompleteSale}
              className={`w-full py-3.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${cart.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700 active:scale-98 text-white shadow-blue-500/25'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Cobrar {formatCurrency(grandTotal)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* CREATE & SAVE SERVICE MODAL (Persists in PostgreSQL) */}
      {showCreateServiceModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Nuevo Servicio</h4>
                  <p className="text-[11px] text-slate-400">Se guardará permanentemente en tu catálogo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateServiceModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateServiceFromPOS} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Recargas Free Fire, Recargas Móviles, Asesoría..."
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
                <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                  Este servicio no requiere costo ni precio fijo. Al guardarse, se añadirá a tu ticket actual y podrás escribir directamente en el carrito el monto que pagó el cliente.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateServiceModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-2xl shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Guardar y Agregar al Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK NEW CUSTOMER CREATION MODAL */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Nuevo Cliente</h4>
                  <p className="text-[11px] text-slate-400">Registrar y seleccionar para esta venta</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCustomerModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerFromPOS} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo / Empresa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. +58 412 1234567"
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección o Notas
                </label>
                <input
                  type="text"
                  placeholder="Notas adicionales o dirección..."
                  value={newCustomerForm.notes}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Guardar y Seleccionar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
