import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Coins,
  Boxes,
  AlertTriangle,
  ArrowRight,
  Plus,
  Eye,
  StickyNote,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Receipt,
  Layers,
  Calendar,
  FileText,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Order, ProductItem, ExpenseItem } from '../types';
import { formatCurrency, formatPercent, STATUS_MAP } from '../utils/formatters';

interface DashboardViewProps {
  orders: Order[];
  products: ProductItem[];
  expenses: ExpenseItem[];
  onNavigateToTab: (tab: any) => void;
  onOpenOrderDetails: (order: Order) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  products,
  expenses,
  onNavigateToTab,
  onOpenOrderDetails,
}) => {
  // Profit calculation mode: 'delivered' (Realized / ডেলিভার্ডকৃত মূল লাভ) vs 'all-active' (Confirmed + Delivered)
  const [calculationMode, setCalculationMode] = useState<'delivered' | 'all-active'>('delivered');
  // Time period filter: 'this_month' | 'today' | 'all'
  const [timePeriod, setTimePeriod] = useState<'this_month' | 'today' | 'all'>('this_month');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // Filter orders by time period
  const periodOrders = useMemo(() => {
    if (timePeriod === 'today') {
      return orders.filter((o) => (o.orderDate === todayStr || o.createdAt?.startsWith(todayStr)));
    }
    if (timePeriod === 'this_month') {
      return orders.filter((o) => (o.orderDate?.startsWith(currentMonthStr) || o.createdAt?.startsWith(currentMonthStr)));
    }
    return orders;
  }, [orders, timePeriod, todayStr, currentMonthStr]);

  // Filter expenses by time period
  const periodExpenses = useMemo(() => {
    if (timePeriod === 'today') {
      return expenses.filter((e) => e.date === todayStr);
    }
    if (timePeriod === 'this_month') {
      return expenses.filter((e) => e.date?.startsWith(currentMonthStr));
    }
    return expenses;
  }, [expenses, timePeriod, todayStr, currentMonthStr]);

  // Filter period orders based on calculation mode
  const activeOrdersForMetrics = useMemo(() => {
    if (calculationMode === 'delivered') {
      return periodOrders.filter((o) => o.status === 'delivered');
    }
    // Exclude cancelled orders from revenue and profit
    return periodOrders.filter((o) => o.status !== 'cancelled');
  }, [periodOrders, calculationMode]);

  // Order Counts for selected period
  const totalOrdersCount = periodOrders.length;
  const deliveredOrdersCount = useMemo(() => periodOrders.filter((o) => o.status === 'delivered').length, [periodOrders]);
  const pendingOrdersCount = useMemo(() => periodOrders.filter((o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'packaging' || o.status === 'shipped').length, [periodOrders]);
  const cancelledOrdersCount = useMemo(() => periodOrders.filter((o) => o.status === 'cancelled').length, [periodOrders]);

  // Revenue & Order Costs (from active/delivered orders in period)
  const totalRevenue = useMemo(() => activeOrdersForMetrics.reduce((s, o) => s + (o.sellingPrice || 0), 0), [activeOrdersForMetrics]);
  const totalOrderCosts = useMemo(() => activeOrdersForMetrics.reduce((s, o) => s + (o.totalCost || 0), 0), [activeOrdersForMetrics]);
  const grossOrderProfit = useMemo(() => totalRevenue - totalOrderCosts, [totalRevenue, totalOrderCosts]);

  // Operational Expenses for period (Marketing, Ads, Internet, etc.)
  const customExpensesTotal = useMemo(() => periodExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0), [periodExpenses]);

  // Total Combined Business Costs: Direct Order Costs + Operational Expenses
  const totalCombinedCosts = totalOrderCosts + customExpensesTotal;

  // True Net Profit: Total Revenue - (Order Costs + Operational Expenses)
  const trueNetProfit = grossOrderProfit - customExpensesTotal;
  const netMargin = totalRevenue > 0 ? (trueNetProfit / totalRevenue) * 100 : 0;

  // Stock Metrics
  const totalStockUnits = useMemo(() => products.reduce((s, p) => s + (p.stock || 0), 0), [products]);
  const stockValuation = useMemo(() => products.reduce((s, p) => s + (p.unitCost || 0) * (p.stock || 0), 0), [products]);
  const lowStockItems = useMemo(() => products.filter((p) => p.stock > 0 && p.stock <= (p.minStockAlert ?? 5)), [products]);
  const outOfStockItems = useMemo(() => products.filter((p) => (p.stock || 0) <= 0), [products]);

  const recentOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt || b.orderDate).getTime() - new Date(a.createdAt || a.orderDate).getTime()).slice(0, 5);
  }, [orders]);

  // Profit trend over last 7 days (based on active orders)
  const profitTrendData = useMemo(() => {
    const result = [];
    let baseDate = new Date();
    if (orders.length > 0) {
      const dates = orders.map((o) => new Date(o.orderDate).getTime()).filter((t) => !isNaN(t));
      if (dates.length > 0) {
        const maxDate = new Date(Math.max(...dates));
        if (maxDate > baseDate) {
          baseDate = maxDate;
        }
      }
    }

    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dayOrders = activeOrdersForMetrics.filter((o) => o.orderDate === dateStr);
      const dayProfit = dayOrders.reduce((sum, o) => sum + (o.netProfit || 0), 0);
      const daySales = dayOrders.reduce((sum, o) => sum + (o.sellingPrice || 0), 0);

      result.push({
        date: dateStr,
        day: dayLabel,
        profit: dayProfit,
        sales: daySales,
        orders: dayOrders.length,
      });
    }
    return result;
  }, [orders, activeOrdersForMetrics]);

  // Export to CSV helper for Excel / Google Sheets (Option ক)
  const exportOrdersToCSV = () => {
    if (orders.length === 0) return;
    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Address', 'Status', 'Items', 'Selling Price (BDT)', 'Product Cost (BDT)', 'Packaging (BDT)', 'Delivery (BDT)', 'Total Cost (BDT)', 'Net Profit (BDT)'];
    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.orderDate}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.customerPhone}"`,
      `"${o.customerAddress.replace(/"/g, '""')}"`,
      `"${o.status}"`,
      `"${o.items.map((i) => `${i.quantity}x ${i.productName}`).join('; ').replace(/"/g, '""')}"`,
      o.sellingPrice,
      o.totalProductCost,
      o.packagingCost,
      o.transportCost,
      o.totalCost,
      o.netProfit,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Order_Log_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner with Period Selector, Calculation Mode & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">ড্যাশবোর্ড (Dashboard)</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {timePeriod === 'today' ? 'আজকের হিসাব' : timePeriod === 'this_month' ? 'চলতি মাসের হিসাব' : 'সার্বিক হিসাব'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            এক নজরে ব্যবসার বিক্রি, মোট খরচ, নিট লাভ, সফল ডেলিভারি ও স্টকের বাস্তব চিত্র
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Period Filter (আজকে / চলতি মাস / সব সময়) */}
          <div className="inline-flex items-center bg-white p-1 rounded-xl border border-neutral-200 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setTimePeriod('today')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                timePeriod === 'today'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              আজকে (Today)
            </button>
            <button
              type="button"
              onClick={() => setTimePeriod('this_month')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                timePeriod === 'this_month'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              এই মাস (This Month)
            </button>
            <button
              type="button"
              onClick={() => setTimePeriod('all')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                timePeriod === 'all'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              সব সময় (All Time)
            </button>
          </div>

          {/* Delivered vs All Orders Mode Selector */}
          <div className="inline-flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs">
            <button
              type="button"
              onClick={() => setCalculationMode('delivered')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                calculationMode === 'delivered'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="শুধুমাত্র সফল ডেলিভারি হওয়া অর্ডারগুলোর আসল লাভ হিসেব করুন"
            >
              ✓ Delivered Only ({deliveredOrdersCount})
            </button>
            <button
              type="button"
              onClick={() => setCalculationMode('all-active')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                calculationMode === 'all-active'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="সকল একটিভ অর্ডারের সম্ভাব্য লাভ হিসেব করুন"
            >
              সব সক্রিয় ({totalOrdersCount - cancelledOrdersCount})
            </button>
          </div>

          {/* Direct Link to New Reports & P&L Module */}
          <button
            type="button"
            onClick={() => onNavigateToTab('reports')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="মাসিক প্রফিট রিপোর্ট ও বিস্তারিত লাভ-ক্ষতি বিবরণী দেখুন"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            <span>মাসিক P&L রিপোর্ট &rarr;</span>
          </button>

          {/* Export to Excel / Google Sheets CSV */}
          <button
            type="button"
            onClick={exportOrdersToCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Google Sheets বা Excel-এ ওপেন করার জন্য CSV ডাউনলোড করুন"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stock Alert if any */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              {outOfStockItems.length > 0 && (
                <strong className="text-rose-700 mr-2">{outOfStockItems.length} items out of stock!</strong>
              )}
              {lowStockItems.length > 0 && (
                <span>{lowStockItems.length} items running low on stock.</span>
              )}
            </span>
          </div>
          <button
            onClick={() => onNavigateToTab('product-list')}
            className="text-amber-800 font-bold hover:underline shrink-0 cursor-pointer"
          >
            Check Products & Stock &rarr;
          </button>
        </div>
      )}

      {/* 4 Core Essential Metric Cards (মডিউল ১: ড্যাশবোর্ড স্পেসিফিকেশন) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. True Net Profit (নিট লাভ) */}
        <div className="bg-emerald-50/80 p-3.5 sm:p-4 rounded-xl border border-emerald-300 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
            <span className="truncate">
              {timePeriod === 'today' ? 'আজকের নিট লাভ' : timePeriod === 'this_month' ? 'এই মাসের নিট লাভ' : 'মোট নিট লাভ'}
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-700 shrink-0" />
          </div>
          <div className={`text-lg sm:text-2xl font-extrabold font-mono truncate ${trueNetProfit >= 0 ? 'text-emerald-900' : 'text-rose-700'}`}>
            {formatCurrency(trueNetProfit)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-700 font-medium mt-1 truncate">
            মার্জিন: <strong>{formatPercent(netMargin)}</strong> (মোট খরচ বাদ দিয়ে)
          </div>
        </div>

        {/* 2. Total Sales / Revenue (মোট বিক্রি) */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
            <span className="truncate">
              {timePeriod === 'today' ? 'আজকের বিক্রি (Revenue)' : timePeriod === 'this_month' ? 'এই মাসের বিক্রি' : 'মোট বিক্রি (Revenue)'}
            </span>
            <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-neutral-900 truncate">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-neutral-500 mt-1 truncate">
            <span className="font-bold font-mono text-neutral-800">{activeOrdersForMetrics.length}</span> টি {calculationMode === 'delivered' ? 'সফল ডেলিভারি' : 'সক্রিয় অর্ডার'}
          </div>
        </div>

        {/* 3. Combined Total Costs (মোট খরচ: COGS + রানিং খরচ) */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
            <span className="truncate">
              {timePeriod === 'today' ? 'আজকের মোট খরচ' : timePeriod === 'this_month' ? 'এই মাসের মোট খরচ' : 'সর্বমোট খরচ (Costs)'}
            </span>
            <Coins className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-rose-600 truncate">
            -{formatCurrency(totalCombinedCosts)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-neutral-500 mt-1 truncate">
            পণ্য/কুরিয়ার {formatCurrency(totalOrderCosts)} + রানিং {formatCurrency(customExpensesTotal)}
          </div>
        </div>

        {/* 4. Delivered & Pending Counts (সফল ডেলিভারি ও পেন্ডিং অর্ডার) */}
        <div
          onClick={() => onNavigateToTab('orders')}
          className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 shadow-2xs cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
            <span className="truncate">ডেলিভারি ও পেন্ডিং</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="flex items-baseline gap-2 truncate">
            <span className="text-lg sm:text-2xl font-bold font-mono text-emerald-700">
              {deliveredOrdersCount}
            </span>
            <span className="text-xs text-neutral-400 font-semibold">ডেলিভার্ড</span>
            <span className="text-neutral-300">/</span>
            <span className="text-lg sm:text-2xl font-bold font-mono text-amber-700">
              {pendingOrdersCount}
            </span>
            <span className="text-xs text-neutral-400 font-semibold">পেন্ডিং</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-neutral-500 mt-1 truncate">
            মোট অর্ডার: <strong className="text-neutral-800">{totalOrdersCount}</strong> টি · সব দেখুন &rarr;
          </div>
        </div>
      </div>

      {/* Financial P&L Breakdown Summary Banner (মডিউল ৪: ফাইন্যান্সিয়াল ড্যাশবোর্ড) */}
      <div className="bg-neutral-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-100">
              P&L Financial Breakdown ({calculationMode === 'delivered' ? 'Delivered Only' : 'Active Orders'})
            </h2>
          </div>
          <span className="text-[11px] text-neutral-400">
            সূত্র: মোট বিক্রি - (প্রোডাক্ট ও প্যাকেজিং কস্ট + রানিং ও মার্কেটিং খরচ) = নিট লাভ
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div>
            <div className="text-[10px] text-neutral-400 font-bold uppercase">১. মোট বিক্রি (Revenue)</div>
            <div className="text-base sm:text-lg font-mono font-bold text-white mt-0.5">
              {formatCurrency(totalRevenue)}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-rose-300 font-bold uppercase">২. (-) অর্ডার কস্ট (COGS)</div>
            <div className="text-base sm:text-lg font-mono font-bold text-rose-300 mt-0.5">
              -{formatCurrency(totalOrderCosts)}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-emerald-400 font-bold uppercase">৩. (=) গ্রস প্রফিট (Gross)</div>
            <div className="text-base sm:text-lg font-mono font-bold text-emerald-400 mt-0.5">
              {formatCurrency(grossOrderProfit)}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-amber-300 font-bold uppercase">৪. (-) রানিং ও অ্যাডস (Expenses)</div>
            <div className="text-base sm:text-lg font-mono font-bold text-amber-300 mt-0.5">
              -{formatCurrency(customExpensesTotal)}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-neutral-800 pt-2 sm:pt-0 sm:pl-3">
            <div className="text-[10px] text-emerald-300 font-bold uppercase">৫. (=) চূড়ান্ত নিট লাভ (Net)</div>
            <div className={`text-lg sm:text-xl font-mono font-bold mt-0.5 ${trueNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(trueNetProfit)}
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Net Profit Trend Chart */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Net Profit Trend (Last 7 Days)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            7-Day Total: {formatCurrency(profitTrendData.reduce((s, d) => s + d.profit, 0))}
          </span>
        </div>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={profitTrendData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `৳${val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-neutral-900 text-white text-xs rounded-xl p-2.5 shadow-lg border border-neutral-700">
                        <div className="font-semibold text-neutral-300 mb-1">{data.day}</div>
                        <div className="text-emerald-400 font-bold font-mono">
                          Net Profit: {formatCurrency(data.profit)}
                        </div>
                        <div className="text-neutral-400 text-[10px] mt-0.5">
                          Sales: {formatCurrency(data.sales)} · {data.orders} orders
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#059669', strokeWidth: 1.5, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#047857', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-neutral-600" />
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Recent Orders
            </h2>
          </div>
          <button
            onClick={() => onNavigateToTab('orders')}
            className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({orders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-400">
            No orders placed yet. Click "New Order" to start.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-neutral-500 font-bold uppercase text-[10px] border-b border-neutral-100">
                  <th className="py-2 px-3">Order #</th>
                  <th className="py-2 px-3">Customer</th>
                  <th className="py-2 px-3">Items</th>
                  <th className="py-2 px-3 text-right">Selling Price</th>
                  <th className="py-2 px-3 text-right">Net Profit</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  <th className="py-2 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentOrders.map((ord) => {
                  const statusInfo = STATUS_MAP[ord.status] || STATUS_MAP.pending;
                  return (
                    <tr key={ord.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-neutral-900 whitespace-nowrap">
                        {ord.orderNumber}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium text-neutral-900">
                        {ord.customerName}
                      </td>
                      <td className="py-2.5 px-3 max-w-[220px] truncate text-neutral-600">
                        {ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                        {formatCurrency(ord.sellingPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        +{formatCurrency(ord.netProfit)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenOrderDetails(ord)}
                          className="text-neutral-500 hover:text-neutral-900 p-1 cursor-pointer"
                          title="View Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
