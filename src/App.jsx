import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { InventoryView } from './components/inventory/InventoryView';
import { SalesView } from './components/sales/SalesView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { CustomersView } from './components/customers/CustomersView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { SettingsView } from './components/settings/SettingsView';

// Modals
import { POSModal } from './components/sales/POSModal';
import { ReceiptModal } from './components/sales/ReceiptModal';
import { ProductModal } from './components/inventory/ProductModal';
import { StockAdjustModal } from './components/inventory/StockAdjustModal';
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
    isExpenseModalOpen,
    setIsExpenseModalOpen,
    isAdjustStockModalOpen,
    setIsAdjustStockModalOpen,
    selectedStockProduct,
    toast,
    hideToast
  } = useApp();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'products':
      case 'inventory':
        return <InventoryView />;
      case 'sales':
        return <SalesView />;
      case 'expenses':
        return <ExpensesView />;
      case 'customers':
        return <CustomersView />;
      case 'suppliers':
        return <SuppliersView />;
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
      <StockAdjustModal
        isOpen={isAdjustStockModalOpen}
        onClose={() => setIsAdjustStockModalOpen(false)}
        product={selectedStockProduct}
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
