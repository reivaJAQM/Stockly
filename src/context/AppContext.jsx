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
  categories: [],
  orders: [],
  expenses: [],
  customers: [],
  suppliers: [],
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
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState(null);
  const [dateRange, setDateRange] = useState('today');
  const [inventorySubTab, setInventorySubTab] = useState('all'); // 'all' | 'sold'
  const [toast, setToast] = useState(null);

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
        categories,
        sales,
        expenses,
        customers,
        suppliers,
        dashboardStats
      ] = await Promise.all([
        api.getSettings().catch(() => defaultState.storeInfo),
        api.getProducts().catch(() => []),
        api.getCategories().catch(() => []),
        api.getSales().catch(() => []),
        api.getExpenses().catch(() => []),
        api.getCustomers().catch(() => []),
        api.getSuppliers().catch(() => []),
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
        categories: categories || [],
        orders: sales || [],
        expenses: expenses || [],
        customers: customers || [],
        suppliers: suppliers || [],
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

  const addSupplier = async (supplierData) => {
    try {
      const created = await api.createSupplier(supplierData);
      await refreshData();
      return created;
    } catch (error) {
      console.error("Error adding supplier:", error);
      alert("Error al guardar proveedor en PostgreSQL.");
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

  const markNotificationsAsRead = () => {
    setData((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true }))
    }));
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
        isExpenseModalOpen,
        setIsExpenseModalOpen,
        editingExpense,
        setEditingExpense,
        isAdjustStockModalOpen,
        setIsAdjustStockModalOpen,
        selectedStockProduct,
        setSelectedStockProduct,
        dateRange,
        setDateRange,
        inventorySubTab,
        setInventorySubTab,
        formatCurrency,
        // Async Database CRUD Methods
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        createSale,
        addOrderPayment,
        updateOrderStatus,
        deleteSale,
        addExpense,
        deleteExpense,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addSupplier,
        addCategory,
        deleteCategory,
        updateSettings,
        setActiveBranch,
        markNotificationsAsRead,
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
