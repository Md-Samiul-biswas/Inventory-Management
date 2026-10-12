import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  X,
  PackageCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ProductItem, Order, OrderStatus, AppSettings, ExpenseItem, SavedPackage } from './types';
import {
  loadProducts,
  saveProducts,
  loadOrders,
  saveOrders,
  loadExpenses,
  saveExpenses,
  loadPackages,
  savePackages,
  loadSettings,
  saveSettings,
  resetAllData,
} from './utils/storage';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { OrdersListView } from './components/OrdersListView';
import { PackagesView } from './components/PackagesView';
import { StockListView } from './components/StockListView';
import { ProductListView } from './components/ProductListView';
import { ExpensesView } from './components/ExpensesView';
import { InvestmentView } from './components/InvestmentView';
import { OrderFormView } from './components/OrderFormView';
import { OrderInvoiceModal } from './components/OrderInvoiceModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [products, setProducts] = useState<ProductItem[]>(loadProducts);
  const [orders, setOrders] = useState<Order[]>(loadOrders);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(loadExpenses);
  const [packages, setPackages] = useState<SavedPackage[]>(loadPackages);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedPackageForOrder, setSelectedPackageForOrder] = useState<SavedPackage | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sync to storage
  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    saveExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    savePackages(packages);
  }, [packages]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);


  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  const totalStockUnits = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock, 0);
  }, [products]);

  // Handle Save Order
  const handleSaveOrder = (newOrder: Order, shouldDeductStock: boolean) => {
    setOrders((prev) => [newOrder, ...prev]);

    if (shouldDeductStock) {
      setProducts((prev) => {
        return prev.map((prod) => {
          const matched = newOrder.items.find((it) => it.productId === prod.id);
          if (matched) {
            return { ...prod, stock: Math.max(0, prod.stock - matched.quantity) };
          }
          return prod;
        });
      });
    }

    showToast(`Order #${newOrder.orderNumber} saved successfully!`, 'success');
    setSelectedOrderForInvoice(newOrder);
    setCurrentTab('orders');
  };

  // Product Actions
  const handleAddProduct = (newProd: ProductItem) => {
    setProducts((prev) => [newProd, ...prev]);
    showToast(`Product "${newProd.name}" added!`, 'success');
  };

  const handleUpdateProduct = (updated: ProductItem) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast(`Product "${updated.name}" updated!`, 'success');
  };

  const handleDeleteProduct = (prodId: string) => {
    const p = products.find((prod) => prod.id === prodId);
    if (window.confirm(`Delete product "${p?.name || 'Item'}"?`)) {
      setProducts((prev) => prev.filter((item) => item.id !== prodId));
      showToast('Product deleted', 'info');
    }
  };

  const handleRestockProduct = (prodId: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === prodId) {
          return { ...p, stock: Math.max(0, p.stock + delta) };
        }
        return p;
      })
    );
  };

  // Order Actions
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    showToast('Order status updated!', 'success');
  };

  const handleDeleteOrder = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    if (window.confirm(`Delete Order #${target.orderNumber}?`)) {
      if (target.isStockDeducted) {
        const restore = window.confirm('Restore inventory stock for these items?');
        if (restore) {
          setProducts((prev) => {
            return prev.map((prod) => {
              const matched = target.items.find((it) => it.productId === prod.id);
              if (matched) {
                return { ...prod, stock: prod.stock + matched.quantity };
              }
              return prod;
            });
          });
        }
      }

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      showToast('Order removed', 'info');
    }
  };

  // Expense Actions
  const handleAddExpense = (expense: ExpenseItem) => {
    setExpenses((prev) => [expense, ...prev]);
    showToast('Expense recorded!', 'success');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast('Expense removed', 'info');
  };

  // Package Actions
  const handleSavePackage = (newPkg: SavedPackage) => {
    setPackages((prev) => {
      const exists = prev.some((p) => p.id === newPkg.id);
      if (exists) {
        return prev.map((p) => (p.id === newPkg.id ? newPkg : p));
      }
      return [newPkg, ...prev];
    });
    showToast(`Package "${newPkg.name}" saved!`, 'success');
  };

  const handleDeletePackage = (pkgId: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== pkgId));
    showToast('Package removed', 'info');
  };

  const handleSelectPackageForOrder = (pkg: SavedPackage) => {
    setSelectedPackageForOrder(pkg);
    setCurrentTab('new-order');
    showToast(`Package "${pkg.name}" loaded for new order!`, 'success');
  };

  // Reset Data
  const handleResetData = () => {
    const res = resetAllData();
    setProducts(res.products);
    setOrders(res.orders);
    setExpenses(res.expenses);
    setSettings(res.settings);
    if (res.packages) setPackages(res.packages);
    showToast('Data reset to default demo data');
  };

  // Import Data
  const handleImportData = (data: {
    products: ProductItem[];
    orders: Order[];
    expenses?: ExpenseItem[];
    settings: AppSettings;
  }) => {
    setProducts(data.products);
    setOrders(data.orders);
    if (data.expenses) setExpenses(data.expenses);
    setSettings(data.settings);
    showToast('Data imported successfully!');
  };

  return (
    <div className="min-h-screen bg-neutral-100/60 text-neutral-900 flex flex-col md:flex-row antialiased selection:bg-emerald-100">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-150 no-print">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg border ${
              toast.type === 'success'
                ? 'bg-emerald-950 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-950 text-white border-rose-700'
                : 'bg-neutral-900 text-white border-neutral-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between no-print sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
            <PackageCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-neutral-900">{settings.shopName}</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Left Sidebar with requested menus */}
      <div className="hidden md:block">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          productCount={products.length}
          totalStockUnits={totalStockUnits}
          orderCount={orders.length}
          packageCount={packages.length}
          onOpenSettings={() => setIsSettingsOpen(true)}
          shopName={settings.shopName}
        />
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-neutral-900/50 flex">
          <div className="w-72 bg-white h-full shadow-xl">
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setIsMobileMenuOpen(false);
              }}
              productCount={products.length}
              totalStockUnits={totalStockUnits}
              orderCount={orders.length}
              packageCount={packages.length}
              onOpenSettings={() => {
                setIsSettingsOpen(true);
                setIsMobileMenuOpen(false);
              }}
              shopName={settings.shopName}
            />
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        {currentTab === 'dashboard' && (
          <DashboardView
            orders={orders}
            products={products}
            expenses={expenses}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
            onOpenOrderDetails={(ord) => setSelectedOrderForInvoice(ord)}
          />
        )}

        {currentTab === 'orders' && (
          <OrdersListView
            orders={orders}
            onOpenOrderDetails={(ord) => setSelectedOrderForInvoice(ord)}
            onUpdateStatus={handleUpdateOrderStatus}
            onDeleteOrder={handleDeleteOrder}
            onAddNewOrder={() => setCurrentTab('new-order')}
          />
        )}

        {currentTab === 'package' && (
          <PackagesView
            packages={packages}
            products={products}
            onSavePackage={handleSavePackage}
            onDeletePackage={handleDeletePackage}
            onSelectPackageForOrder={handleSelectPackageForOrder}
          />
        )}

        {currentTab === 'stock-list' && (
          <StockListView
            products={products}
            onRestockProduct={handleRestockProduct}
            onNavigateToProducts={() => setCurrentTab('product-list')}
          />
        )}

        {currentTab === 'product-list' && (
          <ProductListView
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            orders={orders}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {currentTab === 'investment' && (
          <InvestmentView
            products={products}
            orders={orders}
            expenses={expenses}
          />
        )}

        {currentTab === 'new-order' && (
          <OrderFormView
            products={products}
            settings={settings}
            packages={packages}
            initialPackage={selectedPackageForOrder}
            onSaveOrder={(newOrder, shouldDeductStock) => {
              setSelectedPackageForOrder(null);
              handleSaveOrder(newOrder, shouldDeductStock);
            }}
            onAddNewProduct={handleAddProduct}
            onCancel={() => {
              setSelectedPackageForOrder(null);
              setCurrentTab('dashboard');
            }}
          />
        )}
      </main>


      {/* Printable Invoice Modal */}
      <OrderInvoiceModal
        order={selectedOrderForInvoice}
        settings={settings}
        onClose={() => setSelectedOrderForInvoice(null)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          showToast('Settings saved!');
        }}
        onResetData={handleResetData}
        onImportData={handleImportData}
      />
    </div>
  );
}
