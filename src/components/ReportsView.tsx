import React, { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Coins,
  Receipt,
  ShoppingBag,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Truck,
  Layers,
  ArrowRight,
  PieChart,
  Megaphone,
} from 'lucide-react';
import { Order, ExpenseItem, ProductItem } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { TabType } from './Sidebar';

interface ReportsViewProps {
  orders: Order[];
  expenses: ExpenseItem[];
  products: ProductItem[];
  shopName?: string;
  onNavigateToTab: (tab: TabType) => void;
  onOpenOrderDetails?: (order: Order) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  expenses,
  products,
  shopName = 'Inventory Hub',
  onNavigateToTab,
  onOpenOrderDetails,
}) => {
  // Current date for default selection
  const now = new Date();
  const currentYearStr = now.getFullYear().toString();
  const currentMonthNum = (now.getMonth() + 1).toString().padStart(2, '0');
  const defaultMonthStr = `${currentYearStr}-${currentMonthNum}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthStr);
  const [calculationMode, setCalculationMode] = useState<'delivered' | 'all-active'>('delivered');

  // Month options list derived from data + past 12 months
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    monthSet.add(defaultMonthStr);

    orders.forEach((o) => {
      const d = o.orderDate || o.createdAt?.slice(0, 10);
      if (d && d.length >= 7) {
        monthSet.add(d.slice(0, 7));
      }
    });

    expenses.forEach((e) => {
      if (e.date && e.date.length >= 7) {
        monthSet.add(e.date.slice(0, 7));
      }
    });

    // Also populate past 6 months to ensure smooth navigation
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      monthSet.add(mStr);
    }

    return Array.from(monthSet).sort().reverse();
  }, [orders, expenses, defaultMonthStr]);

  // Navigate prev/next month
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevStr = `${prevDate.getFullYear()}-${(prevDate.getMonth() + 1).toString().padStart(2, '0')}`;
    setSelectedMonth(prevStr);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const nextStr = `${nextDate.getFullYear()}-${(nextDate.getMonth() + 1).toString().padStart(2, '0')}`;
    setSelectedMonth(nextStr);
  };

  // Human-friendly Month label (e.g. October 2026 / অক্টোবর ২০২৬)
  const monthDisplayLabel = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    if (!year || !month) return selectedMonth;
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const monthDisplayLabelEn = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    if (!year || !month) return selectedMonth;
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Orders in the selected month
  const monthlyOrders = useMemo(() => {
    return orders.filter((o) => {
      const d = o.orderDate || o.createdAt?.slice(0, 10);
      return d && d.startsWith(selectedMonth);
    });
  }, [orders, selectedMonth]);

  // Monthly orders qualified for calculation (Delivered only vs All active)
  const monthlyActiveOrders = useMemo(() => {
    if (calculationMode === 'delivered') {
      return monthlyOrders.filter((o) => o.status === 'delivered');
    }
    return monthlyOrders.filter((o) => o.status !== 'cancelled');
  }, [monthlyOrders, calculationMode]);

  // Order counts
  const totalMonthOrdersCount = monthlyOrders.length;
  const deliveredMonthOrdersCount = monthlyOrders.filter((o) => o.status === 'delivered').length;
  const pendingMonthOrdersCount = monthlyOrders.filter((o) =>
    ['pending', 'confirmed', 'packaging', 'shipped'].includes(o.status)
  ).length;
  const cancelledMonthOrdersCount = monthlyOrders.filter((o) => o.status === 'cancelled').length;
  const deliverySuccessRate = totalMonthOrdersCount > 0 ? (deliveredMonthOrdersCount / totalMonthOrdersCount) * 100 : 0;

  // Monthly Revenue & Direct Costs (COGS)
  const monthlyRevenue = useMemo(
    () => monthlyActiveOrders.reduce((sum, o) => sum + (o.sellingPrice || 0), 0),
    [monthlyActiveOrders]
  );

  const monthlyProductCost = useMemo(
    () => monthlyActiveOrders.reduce((sum, o) => sum + (o.totalProductCost || 0), 0),
    [monthlyActiveOrders]
  );

  const monthlyPackagingCost = useMemo(
    () => monthlyActiveOrders.reduce((sum, o) => sum + (o.packagingCost || 0), 0),
    [monthlyActiveOrders]
  );

  const monthlyDeliveryCost = useMemo(
    () => monthlyActiveOrders.reduce((sum, o) => sum + (o.transportCost || 0), 0),
    [monthlyActiveOrders]
  );

  const monthlyTotalCOGS = monthlyProductCost + monthlyPackagingCost + monthlyDeliveryCost;
  const monthlyGrossProfit = monthlyRevenue - monthlyTotalCOGS;
  const grossProfitMargin = monthlyRevenue > 0 ? (monthlyGrossProfit / monthlyRevenue) * 100 : 0;

  // Monthly Operational Expenses (Facebook Ads, Internet, Office, etc.)
  const monthlyExpensesList = useMemo(() => {
    return expenses.filter((e) => e.date && e.date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const monthlyTotalExpenses = useMemo(() => {
    return monthlyExpensesList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [monthlyExpensesList]);

  // Operational Expenses Breakdown by Category
  const monthlyExpenseCategories = useMemo(() => {
    const map: Record<string, number> = {};
    monthlyExpensesList.forEach((e) => {
      const cat = e.category || 'Other';
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(map).map(([name, total]) => ({
      name,
      total,
      percentage: monthlyTotalExpenses > 0 ? (total / monthlyTotalExpenses) * 100 : 0,
    })).sort((a, b) => b.total - a.total);
  }, [monthlyExpensesList, monthlyTotalExpenses]);

  // True Net Profit for the Month: Gross Profit - Operational Expenses
  const monthlyTrueNetProfit = monthlyGrossProfit - monthlyTotalExpenses;
  const monthlyNetMargin = monthlyRevenue > 0 ? (monthlyTrueNetProfit / monthlyRevenue) * 100 : 0;
  const avgOrderValue = monthlyActiveOrders.length > 0 ? Math.round(monthlyRevenue / monthlyActiveOrders.length) : 0;
  const avgProfitPerOrder = monthlyActiveOrders.length > 0 ? Math.round(monthlyTrueNetProfit / monthlyActiveOrders.length) : 0;

  // Month-over-Month historical comparison table (সব মাসের ইতিহাস)
  const historicalMonthsData = useMemo(() => {
    return availableMonths.map((mStr) => {
      const [year, month] = mStr.split('-').map(Number);
      const label = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });

      const mOrders = orders.filter((o) => {
        const d = o.orderDate || o.createdAt?.slice(0, 10);
        return d && d.startsWith(mStr);
      });

      const mActive = calculationMode === 'delivered'
        ? mOrders.filter((o) => o.status === 'delivered')
        : mOrders.filter((o) => o.status !== 'cancelled');

      const rev = mActive.reduce((s, o) => s + (o.sellingPrice || 0), 0);
      const cogs = mActive.reduce((s, o) => s + (o.totalCost || 0), 0);
      const gross = rev - cogs;

      const mExps = expenses.filter((e) => e.date && e.date.startsWith(mStr));
      const expTotal = mExps.reduce((s, e) => s + (Number(e.amount) || 0), 0);

      const net = gross - expTotal;
      const margin = rev > 0 ? (net / rev) * 100 : 0;
      const delivCount = mOrders.filter((o) => o.status === 'delivered').length;

      return {
        monthKey: mStr,
        label,
        ordersCount: mOrders.length,
        deliveredCount: delivCount,
        revenue: rev,
        cogs,
        expenses: expTotal,
        netProfit: net,
        margin,
      };
    });
  }, [availableMonths, orders, expenses, calculationMode]);

  // CSV Export
  const handleExportMonthlyCSV = () => {
    const headers = [
      'Statement Category',
      'Item Description',
      'Amount (BDT)',
      'Percentage (%)',
    ];

    const rows = [
      ['Revenue', 'Total Monthly Sales', monthlyRevenue, '100%'],
      ['COGS', 'Wholesale Product Purchases', monthlyProductCost, formatPercent(monthlyRevenue > 0 ? (monthlyProductCost / monthlyRevenue) * 100 : 0)],
      ['COGS', 'Packaging Materials (Box, Sticker, Ribbon)', monthlyPackagingCost, formatPercent(monthlyRevenue > 0 ? (monthlyPackagingCost / monthlyRevenue) * 100 : 0)],
      ['COGS', 'Delivery & Courier Charges', monthlyDeliveryCost, formatPercent(monthlyRevenue > 0 ? (monthlyDeliveryCost / monthlyRevenue) * 100 : 0)],
      ['COGS Total', 'Total Cost of Goods Sold', monthlyTotalCOGS, formatPercent(monthlyRevenue > 0 ? (monthlyTotalCOGS / monthlyRevenue) * 100 : 0)],
      ['Gross Profit', 'Gross Margin (Revenue - COGS)', monthlyGrossProfit, formatPercent(grossProfitMargin)],
      ['Operational Expenses', 'Running & Marketing Costs', monthlyTotalExpenses, formatPercent(monthlyRevenue > 0 ? (monthlyTotalExpenses / monthlyRevenue) * 100 : 0)],
      ...monthlyExpenseCategories.map((c) => ['Operating Expense Breakdown', c.name, c.total, formatPercent(c.percentage)]),
      ['Net Profit', 'Final Net Operating Profit', monthlyTrueNetProfit, formatPercent(monthlyNetMargin)],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `Monthly_P&L_Report_${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Month Selector Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-2xs">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
              মাসিক ও প্রফিট রিপোর্ট (P&L Summary)
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            মডিউল ৫: মাস সিলেক্ট করে মোট রেভিনিউ, ডিরেক্ট কস্ট, রানিং খরচ বাদ দিয়ে চূড়ান্ত নিট লাভ (Net Profit) এর রিপোর্ট।
          </p>
        </div>

        {/* Toolbar: Month selector & Mode & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector with Prev / Next */}
          <div className="inline-flex items-center bg-white border border-neutral-200 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2 py-1 text-xs font-bold text-neutral-800 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              {availableMonths.map((m) => {
                const [y, mo] = m.split('-').map(Number);
                const label = new Date(y, mo - 1, 1).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                });
                return (
                  <option key={m} value={m}>
                    {label} ({m})
                  </option>
                );
              })}
            </select>

            <button
              type="button"
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Selector */}
          <div className="inline-flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs">
            <button
              type="button"
              onClick={() => setCalculationMode('delivered')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                calculationMode === 'delivered'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="শুধুমাত্র সফল ডেলিভারি হওয়া অর্ডারগুলোর আসল লাভ"
            >
              ✓ Delivered Only
            </button>
            <button
              type="button"
              onClick={() => setCalculationMode('all-active')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                calculationMode === 'all-active'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="সকল একটিভ অর্ডারের সম্ভাব্য লাভ"
            >
              All Active
            </button>
          </div>

          {/* Export & Print */}
          <button
            type="button"
            onClick={handleExportMonthlyCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Selected Month Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-neutral-900 text-white rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>মাসিক বিবরণী ({selectedMonth})</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {monthDisplayLabelEn} <span className="text-emerald-400 font-normal text-lg">({monthDisplayLabel})</span>
            </h2>
            <p className="text-xs text-neutral-300 mt-1">
              হিসাব ভিত্তি: {calculationMode === 'delivered' ? 'শুধুমাত্র সফল ডেলিভারি (Delivered)' : 'সকল সক্রিয় অর্ডার (Active Orders)'} · মোট অর্ডার: {totalMonthOrdersCount} টি
            </p>
          </div>

          <div className="text-right bg-white/10 backdrop-blur-xs px-4 py-3 rounded-xl border border-white/15 shrink-0">
            <div className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider">
              মাসিক চূড়ান্ত নিট লাভ
            </div>
            <div className={`text-2xl font-extrabold font-mono mt-0.5 ${monthlyTrueNetProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
              {formatCurrency(monthlyTrueNetProfit)}
            </div>
            <div className="text-[11px] text-neutral-300 mt-0.5">
              মার্জিন: <strong className="text-white">{formatPercent(monthlyNetMargin)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Financial Summary Cards (ফর্মুলা: রেভিনিউ - কস্ট - রানিং খরচ = নিট লাভ) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Monthly Revenue */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
            <span>১. মোট বিক্রি (Revenue)</span>
            <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 truncate">
            {formatCurrency(monthlyRevenue)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 truncate">
            {monthlyActiveOrders.length} টি সফল অর্ডার থেকে
          </div>
        </div>

        {/* 2. Direct Order Cost (COGS) */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
            <span>২. ডিরেক্ট খরচ (COGS)</span>
            <Coins className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-800 truncate">
            -{formatCurrency(monthlyTotalCOGS)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 truncate">
            পণ্য {formatCurrency(monthlyProductCost)} + প্যাকেজিং {formatCurrency(monthlyPackagingCost)}
          </div>
        </div>

        {/* 3. Operational Running Expenses */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
            <span>৩. রানিং খরচ (Expenses)</span>
            <Megaphone className="w-4 h-4 text-rose-600 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-600 truncate">
            -{formatCurrency(monthlyTotalExpenses)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 truncate">
            ফেসবুক অ্যাডস ও অন্যান্য বিল ({monthlyExpensesList.length} এন্ট্রি)
          </div>
        </div>

        {/* 4. True Net Profit */}
        <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-300 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
            <span>৪. চূড়ান্ত নিট লাভ (Net)</span>
            <TrendingUp className="w-4 h-4 text-emerald-700 shrink-0" />
          </div>
          <div className={`text-xl sm:text-2xl font-extrabold font-mono truncate ${monthlyTrueNetProfit >= 0 ? 'text-emerald-900' : 'text-rose-700'}`}>
            {formatCurrency(monthlyTrueNetProfit)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1 truncate">
            নেট প্রফিট মার্জিন: {formatPercent(monthlyNetMargin)}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Official Accounting Statement & Operational Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Complete Profit & Loss Statement (আর্থিক বিবরণী) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                মাসিক লাভ-ক্ষতি বিবরণী (Profit & Loss Statement)
              </h3>
            </div>
            <span className="text-[11px] font-mono font-semibold text-neutral-500">
              {monthDisplayLabelEn}
            </span>
          </div>

          <div className="divide-y divide-neutral-100 text-xs">
            {/* 1. Gross Revenue */}
            <div className="py-2.5 flex items-center justify-between font-semibold text-neutral-900 bg-neutral-50/50 px-2 rounded-lg">
              <span className="flex items-center gap-1.5 font-bold">
                <span>১. মোট বিক্রয় রেভিনিউ (Gross Revenue)</span>
              </span>
              <span className="font-mono text-sm font-bold text-neutral-900">
                {formatCurrency(monthlyRevenue)}
              </span>
            </div>

            {/* 2. Direct Costs (COGS) Header */}
            <div className="pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-2">
              ২. ডিরেক্ট বিক্রয় খরচ (Cost of Goods Sold - COGS)
            </div>

            {/* Product cost */}
            <div className="py-2 flex items-center justify-between text-neutral-600 px-2">
              <span className="pl-3 text-neutral-700">(-) পাইকারি পণ্য ক্রয় খরচ (Wholesale Products)</span>
              <span className="font-mono text-neutral-800">-{formatCurrency(monthlyProductCost)}</span>
            </div>

            {/* Packaging cost */}
            <div className="py-2 flex items-center justify-between text-neutral-600 px-2">
              <span className="pl-3 text-neutral-700">(-) প্যাকেজিং খরচ (বক্স, স্টিকার, রিবন)</span>
              <span className="font-mono text-neutral-800">-{formatCurrency(monthlyPackagingCost)}</span>
            </div>

            {/* Delivery cost */}
            <div className="py-2 flex items-center justify-between text-neutral-600 px-2">
              <span className="pl-3 text-neutral-700">(-) ডেলিভারি ও কুরিয়ার চার্জ</span>
              <span className="font-mono text-neutral-800">-{formatCurrency(monthlyDeliveryCost)}</span>
            </div>

            {/* Subtotal COGS */}
            <div className="py-2 flex items-center justify-between text-rose-700 font-semibold px-2 bg-rose-50/40 rounded-lg">
              <span className="pl-3">মোট ডিরেক্ট খরচ (Total COGS)</span>
              <span className="font-mono font-bold">-{formatCurrency(monthlyTotalCOGS)}</span>
            </div>

            {/* 3. Gross Profit */}
            <div className="py-2.5 flex items-center justify-between font-bold text-neutral-900 px-2 bg-neutral-50 rounded-lg">
              <span>৩. গ্রস প্রফিট (Gross Profit = বিক্রি - COGS)</span>
              <div className="text-right">
                <span className="font-mono text-sm text-neutral-900">{formatCurrency(monthlyGrossProfit)}</span>
                <span className="text-[10px] text-neutral-500 font-normal ml-2">({formatPercent(grossProfitMargin)} margin)</span>
              </div>
            </div>

            {/* 4. Operating Expenses (OPEX) Header */}
            <div className="pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-2">
              ৪. রানিং ও পরিচালনা ব্যয় (Operating Expenses - OPEX)
            </div>

            {/* Operational Categories */}
            {monthlyExpenseCategories.length === 0 ? (
              <div className="py-2 text-neutral-400 italic px-5 text-[11px]">
                এই মাসে আলাদা কোনো রানিং খরচ এন্ট্রি করা হয়নি।
              </div>
            ) : (
              monthlyExpenseCategories.map((cat) => (
                <div key={cat.name} className="py-2 flex items-center justify-between text-neutral-600 px-2">
                  <span className="pl-3 text-neutral-700">(-) {cat.name}</span>
                  <div className="text-right font-mono">
                    <span className="text-neutral-800">-{formatCurrency(cat.total)}</span>
                    <span className="text-[10px] text-neutral-400 ml-2">({formatPercent(cat.percentage)})</span>
                  </div>
                </div>
              ))
            )}

            {/* Subtotal OPEX */}
            <div className="py-2 flex items-center justify-between text-amber-800 font-semibold px-2 bg-amber-50/40 rounded-lg">
              <span className="pl-3">মোট রানিং ও মার্কেটিং খরচ</span>
              <span className="font-mono font-bold">-{formatCurrency(monthlyTotalExpenses)}</span>
            </div>

            {/* 5. Final Net Operating Profit */}
            <div className={`py-3 flex items-center justify-between font-extrabold px-3 rounded-xl border mt-2 ${
              monthlyTrueNetProfit >= 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}>
              <div>
                <div className="text-sm font-bold">৫. চূড়ান্ত নিট লাভ (True Net Profit)</div>
                <div className="text-[11px] font-normal text-neutral-600">
                  বিক্রি - (প্রোডাক্ট/প্যাকেজিং কস্ট + রানিং খরচ)
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-mono font-extrabold ${monthlyTrueNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(monthlyTrueNetProfit)}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  নিট মার্জিন: {formatPercent(monthlyNetMargin)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Orders Metrics & Expense Distribution */}
        <div className="space-y-6">
          {/* Orders Breakdown Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              অর্ডারের গতি ও কার্যকারিতা
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-neutral-500">মোট অর্ডার রিসিভড</span>
                <span className="font-bold font-mono text-neutral-900">{totalMonthOrdersCount} টি</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>সফল ডেলিভারি</span>
                </span>
                <span className="font-bold font-mono text-emerald-700">{deliveredMonthOrdersCount} টি</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-amber-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>পেন্ডিং / শিপিং চলছে</span>
                </span>
                <span className="font-bold font-mono text-amber-700">{pendingMonthOrdersCount} টি</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <span className="text-rose-600">বাতিল / রিটার্ন</span>
                <span className="font-bold font-mono text-rose-600">{cancelledMonthOrdersCount} টি</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-neutral-500">ডেলিভারি সাকসেস রেট</span>
                <span className="font-bold font-mono text-emerald-700">{formatPercent(deliverySuccessRate)}</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                <span className="text-neutral-500">গড় অর্ডার মূল্য (AOV)</span>
                <span className="font-bold font-mono text-neutral-800">{formatCurrency(avgOrderValue)}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-neutral-500">গড় নিট লাভ প্রতি অর্ডারে</span>
                <span className={`font-bold font-mono ${avgProfitPerOrder >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {formatCurrency(avgProfitPerOrder)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateToTab('orders')}
              className="w-full mt-2 py-2 text-xs font-bold text-neutral-700 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>এই মাসের অর্ডারসমূহ দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Operational Expenses Breakdown Card */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                রানিং খরচের খাতসমূহ
              </h3>
              <button
                type="button"
                onClick={() => onNavigateToTab('expenses')}
                className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                + খরচ এন্ট্রি
              </button>
            </div>

            {monthlyExpenseCategories.length === 0 ? (
              <div className="text-center py-4 text-xs text-neutral-400">
                এই মাসে কোনো খরচ এন্ট্রি করা নেই।
              </div>
            ) : (
              <div className="space-y-3">
                {monthlyExpenseCategories.map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-700">{cat.name}</span>
                      <span className="font-mono text-neutral-900">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Month-by-Month Table (বাৎসরিক সকল মাসের লাভ-লস পর্যালোচনা) */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              বাৎসরিক সকল মাসের লাভ-লস পর্যালোচনা (Historical Comparison)
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              প্রতি মাসের মোট বিক্রি, খরচ, রানিং এক্সপেন্স ও লাভ-মার্জিনের তুলনামূলক তালিকা।
            </p>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {historicalMonthsData.length} টি মাস
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-neutral-500 font-bold uppercase text-[10px] border-b border-neutral-200 bg-neutral-50/50">
                <th className="py-2.5 px-3">মাস (Month)</th>
                <th className="py-2.5 px-3 text-center">অর্ডার সংখ্যা</th>
                <th className="py-2.5 px-3 text-right">মোট বিক্রি (Revenue)</th>
                <th className="py-2.5 px-3 text-right">ডিরেক্ট খরচ (COGS)</th>
                <th className="py-2.5 px-3 text-right">রানিং খরচ (OPEX)</th>
                <th className="py-2.5 px-3 text-right">চূড়ান্ত নিট লাভ</th>
                <th className="py-2.5 px-3 text-right">মার্জিন (%)</th>
                <th className="py-2.5 px-3 text-center">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium">
              {historicalMonthsData.map((row) => {
                const isSelected = row.monthKey === selectedMonth;
                return (
                  <tr
                    key={row.monthKey}
                    className={`hover:bg-neutral-50/80 transition-colors ${
                      isSelected ? 'bg-emerald-50/60 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                        <span>{row.label}</span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded text-[9px]">
                            বর্তমান
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">{row.monthKey}</div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      <span className="text-neutral-800 font-bold">{row.ordersCount}</span>
                      <span className="text-neutral-400 text-[10px] ml-1">({row.deliveredCount} del.)</span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-neutral-900 font-bold">
                      {formatCurrency(row.revenue)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-rose-700">
                      -{formatCurrency(row.cogs)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-amber-700">
                      -{formatCurrency(row.expenses)}
                    </td>

                    <td className={`py-3 px-3 text-right font-mono font-bold ${
                      row.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {formatCurrency(row.netProfit)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-neutral-600">
                      {formatPercent(row.margin)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedMonth(row.monthKey)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {isSelected ? 'নির্বাচিত' : 'লোড করুন'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
