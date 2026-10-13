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
  StickyNote,
  Truck,
  FileText,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'orders'
  | 'courier'
  | 'package'
  | 'stock-list'
  | 'product-list'
  | 'expenses'
  | 'reports'
  | 'investment'
  | 'keep-notes'
  | 'new-order';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  productCount: number;
  totalStockUnits: number;
  orderCount: number;
  packageCount?: number;
  notesCount?: number;
  courierActiveCount?: number;
  onOpenSettings: (tab?: 'general' | 'courier') => void;
  shopName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  productCount,
  totalStockUnits,
  orderCount,
  packageCount = 0,
  notesCount = 0,
  courierActiveCount = 0,
  onOpenSettings,
  shopName,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      sublabel: 'ড্যাশবোর্ড',
      icon: LayoutDashboard,
    },
    {
      id: 'orders' as TabType,
      label: 'Orders & Sales',
      sublabel: 'অর্ডার ও সেলস',
      icon: ShoppingBag,
      badge: orderCount > 0 ? orderCount : undefined,
    },
    {
      id: 'product-list' as TabType,
      label: 'Inventory & Stock',
      sublabel: 'ইনভেন্টরি ও স্টক',
      icon: Layers,
      badge: productCount > 0 ? productCount : undefined,
    },
    {
      id: 'expenses' as TabType,
      label: 'Expenses',
      sublabel: 'রানিং খরচ',
      icon: Receipt,
    },
    {
      id: 'reports' as TabType,
      label: 'Reports & P&L',
      sublabel: 'মাসিক প্রফিট রিপোর্ট',
      icon: FileText,
    },
    {
      id: 'courier' as TabType,
      label: 'Courier (Pathao)',
      sublabel: 'কুরিয়ার পার্টনার',
      icon: Truck,
      badge: courierActiveCount > 0 ? courierActiveCount : undefined,
    },
    {
      id: 'package' as TabType,
      label: 'Package Sets',
      sublabel: 'প্যাকেজিং বক্স ও সেট',
      icon: Package,
    },
    {
      id: 'investment' as TabType,
      label: 'Investment',
      sublabel: 'ইনভেস্টমেন্ট ও মূলধন',
      icon: TrendingUp,
    },
    {
      id: 'keep-notes' as TabType,
      label: 'Keep Notes & Tasks',
      sublabel: 'নোটস ও টাস্ক',
      icon: StickyNote,
      badge: notesCount > 0 ? notesCount : undefined,
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
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-neutral-400'
                  }`}
                />
                <div className="min-w-0">
                  <div className="truncate leading-tight">{item.label}</div>
                  {item.sublabel && (
                    <div className={`text-[10px] leading-tight mt-0.5 truncate font-normal ${
                      isActive ? 'text-neutral-300' : 'text-neutral-400'
                    }`}>
                      {item.sublabel}
                    </div>
                  )}
                </div>
              </div>
              {item.badge !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-amber-400 text-neutral-900' : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Settings */}
      <div className="p-3 border-t border-neutral-100 space-y-1">
        <button
          onClick={() => onOpenSettings('general')}
          className="w-full flex items-center justify-between p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 text-xs font-semibold transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-neutral-400" />
            <span>Settings</span>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>

        {/* Courier Setting Submenu */}
        <button
          onClick={() => onOpenSettings('courier')}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 text-xs font-medium transition-colors cursor-pointer pl-7 group"
        >
          <div className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-rose-500 group-hover:scale-105 transition-transform" />
            <span className="text-[11px] font-semibold">Courier Setting</span>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
            API
          </span>
        </button>
      </div>
    </aside>
  );
};
