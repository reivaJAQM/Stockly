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
  Check
} from 'lucide-react';

export const POSModal = ({ isOpen, onClose }) => {
  const { data, createSale, formatCurrency, setSelectedReceiptOrder, showToast } = useApp();

  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null); // null = Cliente Mostrador by default
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [cashGiven, setCashGiven] = useState('');
  const [initialPayment, setInitialPayment] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  if (!isOpen) return null;

  const categories = ['all', ...Array.from(new Set((data.products || []).map((p) => p.category).filter(Boolean)))];

  const filteredProducts = (data.products || []).filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.barcode && p.barcode.includes(searchTerm));
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Cart operations
  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Cannot exceed stock
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
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

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
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

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
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
        productId: i.productId,
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
        setSelectedReceiptOrder({
          ...newOrder,
          cashGiven: salePayload.cashGiven,
          cashChange: salePayload.cashChange
        });
      }
    } catch (error) {
      console.error('Error al registrar venta:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-6xl h-[94vh] max-h-[880px] shadow-2xl border border-slate-100 flex flex-col lg:flex-row overflow-hidden animate-in fade-in zoom-in-95 my-auto">

        {/* LEFT COLUMN: Product Catalog Picker */}
        <div className="flex-1 flex flex-col border-r border-slate-100 bg-slate-50/50 p-4 lg:p-6 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">Punto de Venta</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Selecciona los productos para agregarlos a la factura</p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs">
              {filteredProducts.length} productos
            </span>
          </div>

          {/* Search Bar */}
          <div className="mt-3.5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 shadow-2xs"
            />
          </div>

          {/* Proprietary Category Pills Selector (Custom Stockly Identity) */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar">
            {categories.map((c) => {
              const isActive = selectedCategory === c;
              const label = c === 'all' ? 'Todos los productos' : c;
              const count = c === 'all'
                ? data.products.length
                : data.products.filter((p) => p.category === c).length;

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategory(c)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-600'
                      : 'bg-white text-slate-600 hover:bg-slate-100/90 border border-slate-200/80 hover:border-slate-300 shadow-2xs'
                    }`}
                >
                  {c === 'all' ? (
                    <Layers className="w-3.5 h-3.5" />
                  ) : (
                    <Package className="w-3.5 h-3.5" />
                  )}
                  <span>{label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Products Grid Compact and Clean (No vertical stretching) */}
          <div className="flex-1 overflow-y-auto mt-3 pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3.5 content-start auto-rows-max">
            {filteredProducts.map((product) => {
              const inCartItem = cart.find((i) => i.productId === product.id);
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

                  {/* Compact Square Image Container */}
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
                  {/* Search Input */}
                  <div className="relative flex-shrink-0">
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
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold transition-colors ${
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
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold transition-colors ${
                              isSelected
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black flex-shrink-0">
                                {cust.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate">{cust.name}</span>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}

                    {(data.customers || []).filter((c) =>
                      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
                    ).length === 0 && customerSearchQuery.trim() !== '' && (
                      <p className="text-center py-3 text-[11px] text-slate-400 font-medium">
                        No se encontró ningún cliente con ese nombre
                      </p>
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
                key={item.productId}
                className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/70 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h6 className="font-bold text-xs text-slate-800 truncate">{item.name}</h6>
                    <span className="text-[11px] font-extrabold text-blue-600 block">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>

                {/* Quantity Buttons */}
                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-extrabold text-slate-900 w-4 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    disabled={item.quantity >= item.maxStock}
                    className={`p-1 rounded-md transition-colors ${item.quantity >= item.maxStock
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-center px-4">
                <ShoppingCart className="w-8 h-8 mb-2 opacity-30 text-slate-400" />
                <p className="font-bold text-xs text-slate-600">El ticket está vacío</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Haz clic en los productos para agregarlos.</p>
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
                  {[20, 50, 100].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => setCashGiven(String(bill))}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                    >
                      ${bill}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashGiven(String(Math.ceil(grandTotal)))}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 hover:bg-emerald-200 transition-colors ml-auto shadow-2xs"
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
              className={`w-full py-3.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${cart.length > 0
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
    </div>
  );
};
