import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { InventoryView } from './components/inventory/InventoryView';
import { ServicesView } from './components/services/ServicesView';
import { SalesView } from './components/sales/SalesView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { CustomersView } from './components/customers/CustomersView';
import { ChartsView } from './components/charts/ChartsView';
import { SettingsView } from './components/settings/SettingsView';

// Modals
import { POSModal } from './components/sales/POSModal';
import { ReceiptModal } from './components/sales/ReceiptModal';
import { ProductModal } from './components/inventory/ProductModal';
import { ServiceModal } from './components/inventory/ServiceModal';
import { StockAdjustModal } from './components/inventory/StockAdjustModal';
import { StockEntryModal } from './components/inventory/StockEntryModal';
import { ExpenseModal } from './components/expenses/ExpenseModal';
import { CommandPalette } from './components/common/CommandPalette';
import { ToastNotification } from './components/common/ToastNotification';

export function App() {
  const {
    activeTab,
    isPOSOpen,
    setIsPOSOpen,
    selectedReceiptOrder,
    setSelectedReceiptOrder,
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
    isCustomerModalOpen,
    setIsCustomerModalOpen,
    editingCustomer,
    setEditingCustomer,
    isAdjustStockModalOpen,
    setIsAdjustStockModalOpen,
    selectedStockProduct,
    isRestockModalOpen,
    setIsRestockModalOpen,
    restockInitialProduct,
    isCommandPaletteOpen,
    toast,
    hideToast
  } = useApp();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global keyboard shortcut: Pressing Space opens the primary action for the active tab
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code !== 'Space' && e.key !== ' ') return;

      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable);

      if (isInput) return;

      const isAnyModalOpen =
        isPOSOpen ||
        isProductModalOpen ||
        isServiceModalOpen ||
        isExpenseModalOpen ||
        isCustomerModalOpen ||
        isAdjustStockModalOpen ||
        Boolean(selectedReceiptOrder) ||
        isCommandPaletteOpen;

      if (isAnyModalOpen) return;

      e.preventDefault();

      switch (activeTab) {
        case 'dashboard':
        case 'sales':
          setIsPOSOpen(true);
          break;
        case 'inventory':
        case 'products':
          setEditingProduct?.(null);
          setIsProductModalOpen(true);
          break;
        case 'services':
          setEditingService?.(null);
          setIsServiceModalOpen(true);
          break;
        case 'expenses':
          setIsExpenseModalOpen(true);
          break;
        case 'customers':
          setEditingCustomer?.(null);
          setIsCustomerModalOpen(true);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTab,
    isPOSOpen,
    isProductModalOpen,
    isServiceModalOpen,
    isExpenseModalOpen,
    isCustomerModalOpen,
    isAdjustStockModalOpen,
    selectedReceiptOrder,
    isCommandPaletteOpen,
    setIsPOSOpen,
    setEditingProduct,
    setIsProductModalOpen,
    setEditingService,
    setIsServiceModalOpen,
    setIsExpenseModalOpen,
    setEditingCustomer,
    setIsCustomerModalOpen
  ]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'products':
      case 'inventory':
        return <InventoryView />;
      case 'services':
        return <ServicesView />;
      case 'sales':
        return <SalesView />;
      case 'expenses':
        return <ExpensesView />;
      case 'customers':
        return <CustomersView />;
      case 'charts':
      case 'reports':
      case 'analytics':
        return <ChartsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        {/* Top Header */}
        <Header setIsSidebarOpen={setIsSidebarOpen} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals */}
      <POSModal isOpen={isPOSOpen} onClose={() => setIsPOSOpen(false)} />
      <ReceiptModal order={selectedReceiptOrder} onClose={() => setSelectedReceiptOrder(null)} />
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={editingProduct}
      />
      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setEditingService(null);
        }}
        serviceToEdit={editingService}
      />
      <StockAdjustModal
        isOpen={isAdjustStockModalOpen}
        onClose={() => setIsAdjustStockModalOpen(false)}
        product={selectedStockProduct}
      />
      <StockEntryModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        initialProduct={restockInitialProduct}
      />
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
      <CommandPalette />
      <ToastNotification toast={toast} onClose={hideToast} />
    </div>
  );
}

export default App;
