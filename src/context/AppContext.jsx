import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

const AppContext = createContext();

const defaultState = {
  storeInfo: {
    name: "Mi Negocio",
    activeBranch: "Tienda Principal",
    branches: ["Tienda Principal", "Sucursal Norte", "Bodega Central"],
    currency: "USD",
    currencySymbol: "$",
    taxRate: 16,
    address: "",
    phone: "",
    user: {
      name: "Alejandro",
      role: "Administrador",
      email: "alejandro@stockly.app",
      avatar: null
    }
  },
  kpis: {
    totalSales: 0,
    totalSalesGrowth: 0,
    ordersCount: 0,
    ordersGrowth: 0,
    newCustomersCount: 0,
    customersGrowth: 0,
    productsSoldCount: 0,
    productsGrowth: 0,
    totalExpenses: 0
  },
  salesChartData: [],
  salesChannels: {
    total: 0,
    channels: [
      { id: "physical", name: "Tienda física", amount: 0, percentage: 0, color: "#3b82f6" },
      { id: "online", name: "Tienda online", amount: 0, percentage: 0, color: "#10b981" },
      { id: "marketplace", name: "Marketplace", amount: 0, percentage: 0, color: "#f59e0b" }
    ]
  },
  products: [],
  services: [],
  categories: [],
  orders: [],
  expenses: [],
  customers: [],
  activityLog: [],
  notifications: []
};

export const AppProvider = ({ children }) => {
  const [data, setData] = useState(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockInitialProduct, setRestockInitialProduct] = useState(null);

  const openRestockModal = useCallback((product = null) => {
    setRestockInitialProduct(product);
    setIsRestockModalOpen(true);
  }, []);

  const [dateRange, setDateRange] = useState('today');
  const [inventorySubTab, setInventorySubTab] = useState('all'); // 'all' | 'sold'
  const [toast, setToast] = useState(null);

  // Dedicated categories for expenses (completely separated from inventory products)
  const [expenseCategories, setExpenseCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('stockly_expense_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addExpenseCategory = useCallback((catName) => {
    const clean = (catName || '').trim();
    if (!clean) return;
    setExpenseCategories((prev) => {
      if (prev.includes(clean)) return prev;
      const updated = [...prev, clean];
      try {
        localStorage.setItem('stockly_expense_categories', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  const showToast = useCallback(({ type = 'success', title, message }) => {
    setToast({ type, title, message });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Load all data from PostgreSQL API
  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        settings,
        products,
        services,
        categories,
        sales,
        expenses,
        customers,
        dashboardStats
      ] = await Promise.all([
        api.getSettings().catch(() => defaultState.storeInfo),
        api.getProducts().catch(() => []),
        api.getServices().catch(() => []),
        api.getCategories().catch(() => []),
        api.getSales().catch(() => []),
        api.getExpenses().catch(() => []),
        api.getCustomers().catch(() => []),
        api.getDashboardStats().catch(() => ({
          kpis: defaultState.kpis,
          salesChannels: defaultState.salesChannels,
          salesChartData: [],
          activityLog: []
        }))
      ]);

      setData({
        storeInfo: settings,
        products: products || [],
        services: services || [],
        categories: categories || [],
        orders: sales || [],
        expenses: expenses || [],
        customers: customers || [],
        kpis: dashboardStats.kpis || defaultState.kpis,
        salesChannels: dashboardStats.salesChannels || defaultState.salesChannels,
        salesChartData: dashboardStats.salesChartData || [],
        activityLog: dashboardStats.activityLog || [],
        notifications: dashboardStats.notifications || []
      });
    } catch (error) {
      console.error("Error al cargar datos desde PostgreSQL:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Global keyboard shortcut for Command Palette (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Currency helper
  const formatCurrency = (amount) => {
    const sym = data.storeInfo.currencySymbol || '$';
    return `${sym}${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 1. PRODUCTS & INVENTORY ACTIONS
  const addProduct = async (productData) => {
    try {
      const created = await api.createProduct(productData);
      await refreshData();
      showToast({
        type: 'success',
        title: 'Producto Creado',
        message: `"${productData.name}" añadido correctamente al inventario.`
      });
      return created;
    } catch (error) {
      console.error("Error creating product:", error);
      showToast({
        type: 'error',
        title: 'Error al Guardar',
        message: 'No se pudo guardar el producto.'
      });
    }
  };

  const updateProduct = async (id, updatedFields) => {
    try {
      const updated = await api.updateProduct(id, updatedFields);
      await refreshData();
      showToast({
        type: 'success',
        title: 'Producto Actualizado',
        message: 'Los cambios fueron aplicados correctamente.'
      });
      return updated;
    } catch (error) {
      console.error("Error updating product:", error);
      showToast({
        type: 'error',
        title: 'Error al Actualizar',
        message: 'No se pudo actualizar el producto.'
      });
    }
  };

  const deleteProduct = async (id) => {
    try {
      await api.deleteProduct(id);
      await refreshData();
      showToast({
        type: 'info',
        title: 'Producto Eliminado',
        message: 'El producto fue eliminado del inventario.'
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast({
        type: 'error',
        title: 'Error al Eliminar',
        message: 'No se pudo eliminar el producto de la base de datos.'
      });
    }
  };

  const adjustStock = async (productId, amount, reason = 'Ajuste manual') => {
    try {
      await api.adjustStock(productId, amount, reason);
      await refreshData();
    } catch (error) {
      console.error("Error adjusting stock:", error);
      alert("Error al ajustar existencias en PostgreSQL.");
    }
  };

  const batchRestock = async (restockData) => {
    try {
      const res = await api.batchRestock(restockData);
      await refreshData();
      showToast({
        type: 'success',
        title: 'Entrada de Mercancía Exitosa',
        message: `Se actualizaron las existencias de ${res.updatedCount || restockData.items?.length || 1} producto(s).`
      });
      return res;
    } catch (error) {
      console.error("Error batch restocking:", error);
      showToast({
        type: 'error',
        title: 'Error al Registrar Entrada',
        message: error.message || 'No se pudo registrar la entrada de mercancía.'
      });
      throw error;
    }
  };


  // 2. SALES ACTIONS
  const createSale = async (saleData) => {
    try {
      const createdOrder = await api.createSale(saleData);
      await refreshData();
      return createdOrder;
    } catch (error) {
      console.error("Error creating sale:", error);
      alert("Error al procesar la venta en la base de datos.");
      throw error;
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      await refreshData();
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const addOrderPayment = async (orderId, paymentData) => {
    try {
      const result = await api.addPaymentToOrder(orderId, paymentData);
      await refreshData();
      showToast({
        type: 'success',
        title: 'Abono Registrado',
        message: `Se registró un abono de $${Number(paymentData.amount).toFixed(2)} correctamente.`
      });
      return result;
    } catch (error) {
      console.error("Error adding order payment:", error);
      showToast({
        type: 'error',
        title: 'Error al Registrar Abono',
        message: error.message || 'No se pudo registrar el abono en la base de datos.'
      });
      throw error;
    }
  };

  const settleMultipleCustomerOrders = async (orders, paymentMethod = 'Efectivo', notes = '') => {
    try {
      for (const order of orders) {
        const balance = Number(order.balanceDue !== undefined ? order.balanceDue : (order.balance_due || 0));
        if (balance > 0) {
          await api.addPaymentToOrder(order.id, {
            amount: balance,
            paymentMethod,
            notes: notes || 'Liquidación total de deuda'
          });
        }
      }
      await refreshData();
      showToast({
        type: 'success',
        title: 'Cuentas Liquidadas',
        message: 'Se liquidaron todas las deudas del cliente exitosamente.'
      });
    } catch (error) {
      console.error("Error settling customer orders:", error);
      showToast({
        type: 'error',
        title: 'Error al Liquidar Cuentas',
        message: error.message || 'No se pudieron liquidar todas las deudas.'
      });
      throw error;
    }
  };

  const applyGlobalPayment = async (orders, totalAmount, paymentMethod = 'Efectivo', notes = '') => {
    try {
      let remaining = Number(totalAmount);
      if (!remaining || remaining <= 0) return;

      // Ordenar por las más antiguas primero (FIFO)
      const sortedOrders = [...orders].sort(
        (a, b) => new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at)
      );

      for (const order of sortedOrders) {
        if (remaining <= 0) break;
        const balance = Number(order.balanceDue !== undefined ? order.balanceDue : (order.balance_due || 0));
        if (balance > 0) {
          const payForThis = Math.min(remaining, balance);
          await api.addPaymentToOrder(order.id, {
            amount: payForThis,
            paymentMethod,
            notes: notes || `Abono global (${paymentMethod})`
          });
          remaining -= payForThis;
        }
      }

      await refreshData();
      showToast({
        type: 'success',
        title: 'Abono Global Registrado',
        message: `Se aplicó el abono de $${Number(totalAmount).toFixed(2)} a las cuentas del cliente.`
      });
    } catch (error) {
      console.error("Error applying global payment:", error);
      showToast({
        type: 'error',
        title: 'Error en Abono Global',
        message: error.message || 'No se pudo registrar el abono global.'
      });
      throw error;
    }
  };

  const deleteSale = async (orderId) => {
    try {
      await api.deleteSale(orderId);
      await refreshData();
      showToast({
        type: 'success',
        title: 'Orden Eliminada',
        message: `La orden ${orderId} fue eliminada y los productos regresaron al inventario.`
      });
    } catch (error) {
      console.error("Error deleting sale:", error);
      showToast({
        type: 'error',
        title: 'Error al Eliminar',
        message: 'No se pudo eliminar la orden de la base de datos.'
      });
      throw error;
    }
  };

  // 3. EXPENSES ACTIONS
  const addExpense = async (expenseData) => {
    try {
      const created = await api.createExpense(expenseData);
      await refreshData();
      return created;
    } catch (error) {
      console.error("Error creating expense:", error);
      alert("Error al registrar gasto en PostgreSQL.");
    }
  };

  const deleteExpense = async (id) => {
    try {
      await api.deleteExpense(id);
      await refreshData();
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Error al eliminar gasto.");
    }
  };

  // 4. CUSTOMERS & SUPPLIERS ACTIONS
  const addCustomer = async (customerData) => {
    try {
      const created = await api.createCustomer(customerData);
      await refreshData();
      showToast({
        type: 'success',
        title: 'Cliente Guardado',
        message: `"${customerData.name}" registrado en el directorio.`
      });
      return created;
    } catch (error) {
      console.error("Error adding customer:", error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar el cliente.'
      });
    }
  };

  const updateCustomer = async (id, customerData) => {
    try {
      const updated = await api.updateCustomer(id, customerData);
      await refreshData();
      showToast({
        type: 'success',
        title: 'Cliente Actualizado',
        message: `Datos de "${customerData.name}" actualizados.`
      });
      return updated;
    } catch (error) {
      console.error("Error updating customer:", error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo actualizar el cliente.'
      });
    }
  };

  const deleteCustomer = async (id) => {
    try {
      await api.deleteCustomer(id);
      await refreshData();
      showToast({
        type: 'info',
        title: 'Cliente Eliminado',
        message: 'El cliente fue eliminado del directorio.'
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el cliente.'
      });
    }
  };

  // Categories in PostgreSQL
  const addCategory = async (categoryName, color) => {
    try {
      const created = await api.createCategory({ name: categoryName, color });
      await refreshData();
      return created;
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const deleteCategory = async (id) => {
    try {
      await api.deleteCategory(id);
      await refreshData();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  // Services (Servicios digitales / ingresos sin costo)
  const addService = async (serviceData) => {
    try {
      const created = await api.createService(serviceData);
      await refreshData();
      showToast({
        type: 'success',
        title: 'Servicio Registrado',
        message: `El servicio "${serviceData.name}" se guardó en el catálogo.`
      });
      return created;
    } catch (error) {
      console.error("Error adding service:", error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo registrar el servicio.'
      });
    }
  };

  const updateService = async (id, serviceData) => {
    try {
      const updated = await api.updateService(id, serviceData);
      await refreshData();
      showToast({
        type: 'success',
        title: 'Servicio Actualizado',
        message: 'Los datos del servicio han sido guardados.'
      });
      return updated;
    } catch (error) {
      console.error("Error updating service:", error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo actualizar el servicio.'
      });
    }
  };

  const deleteService = async (id) => {
    try {
      await api.deleteService(id);
      await refreshData();
      showToast({
        type: 'info',
        title: 'Servicio Eliminado',
        message: 'El servicio fue eliminado del catálogo.'
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el servicio.'
      });
    }
  };

  // Settings
  const updateSettings = async (settingsData) => {
    try {
      await api.updateSettings(settingsData);
      await refreshData();
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const setActiveBranch = (branch) => {
    setData((prev) => ({
      ...prev,
      storeInfo: {
        ...prev.storeInfo,
        activeBranch: branch
      }
    }));
  };

  const markNotificationsAsRead = async () => {
    setData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) => ({ ...n, read: true }))
    }));

    try {
      await api.markAllNotificationsRead();
    } catch (err) {
      console.error("Error al marcar todas las notificaciones como leídas:", err);
    }
  };

  const markSingleNotificationAsRead = async (id) => {
    setData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
    }));

    try {
      await api.markNotificationRead(id);
    } catch (err) {
      console.error("Error al marcar notificación como leída:", err);
    }
  };

  const clearAllNotifications = async () => {
    setData((prev) => ({
      ...prev,
      notifications: []
    }));

    try {
      await api.clearNotifications();
    } catch (err) {
      console.error("Error al limpiar notificaciones:", err);
    }
  };

  const deleteSingleNotification = async (id) => {
    setData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).filter((n) => n.id !== id)
    }));

    try {
      await api.deleteNotification(id);
    } catch (err) {
      console.error("Error al eliminar notificación:", err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        data,
        setData,
        isLoading,
        refreshData,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        selectedReceiptOrder,
        setSelectedReceiptOrder,
        isPOSOpen,
        setIsPOSOpen,
        isProductModalOpen,
        setIsProductModalOpen,
        editingProduct,
        setEditingProduct,
        isServiceModalOpen,
        setIsServiceModalOpen,
        editingService,
        setEditingService,
        isExpenseModalOpen,
        setIsExpenseModalOpen,
        editingExpense,
        setEditingExpense,
        isCustomerModalOpen,
        setIsCustomerModalOpen,
        editingCustomer,
        setEditingCustomer,
        isAdjustStockModalOpen,
        setIsAdjustStockModalOpen,
        selectedStockProduct,
        setSelectedStockProduct,
        isRestockModalOpen,
        setIsRestockModalOpen,
        restockInitialProduct,
        setRestockInitialProduct,
        openRestockModal,
        batchRestock,
        dateRange,
        setDateRange,
        inventorySubTab,
        setInventorySubTab,
        formatCurrency,
        // Async Database CRUD Methods
        addProduct,
        updateProduct,
        deleteProduct,
        addService,
        updateService,
        deleteService,
        adjustStock,
        createSale,
        addOrderPayment,
        settleMultipleCustomerOrders,
        applyGlobalPayment,
        updateOrderStatus,
        deleteSale,
        addExpense,
        deleteExpense,
        expenseCategories,
        addExpenseCategory,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addCategory,
        deleteCategory,
        updateSettings,
        setActiveBranch,
        markNotificationsAsRead,
        markSingleNotificationAsRead,
        clearAllNotifications,
        deleteSingleNotification,
        toast,
        showToast,
        hideToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
