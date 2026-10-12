import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  Layers,
  Receipt,
  TrendingUp,
  Plus,
  Settings,
  PackageCheck,
  ChevronRight,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'orders'
  | 'package'
  | 'stock-list'
  | 'product-list'
  | 'expenses'
  | 'investment'
  | 'new-order';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  productCount: number;
  totalStockUnits: number;
  orderCount: number;
  packageCount?: number;
  onOpenSettings: () => void;
  shopName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  productCount,
  totalStockUnits,
  orderCount,
  packageCount = 0,
  onOpenSettings,
  shopName,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'orders' as TabType,
      label: 'Order Management',
      icon: ShoppingBag,
    },
    {
      id: 'package' as TabType,
      label: 'Package',
      icon: Package,
    },
    {
      id: 'stock-list' as TabType,
      label: 'Stock List',
      icon: Boxes,
    },
    {
      id: 'product-list' as TabType,
      label: 'Product List',
      icon: Layers,
    },
    {
      id: 'expenses' as TabType,
      label: 'Expenses',
      icon: Receipt,
    },
    {
      id: 'investment' as TabType,
      label: 'Investment',
      icon: TrendingUp,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col shrink-0 min-h-screen no-print">
      {/* Brand Header */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <PackageCheck className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-neutral-900 text-sm leading-tight truncate">
              {shopName || 'Inventory Hub'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick New Order CTA */}
      <div className="p-3 pb-1">
        <button
          onClick={() => onSelectTab('new-order')}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
            currentTab === 'new-order'
              ? 'bg-emerald-700 text-white'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>New Order</span>
        </button>
      </div>

      {/* Main Vertical Navigation */}
      <div className="flex-1 px-3 py-2 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Menu
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-neutral-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Settings */}
      <div className="p-3 border-t border-neutral-100">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 text-xs font-semibold transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-neutral-400" />
            <span>Settings</span>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>
      </div>
    </aside>
  );
};
