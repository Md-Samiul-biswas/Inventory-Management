import React, { useMemo } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Coins,
  Boxes,
  AlertTriangle,
  ArrowRight,
  Plus,
  Eye,
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
  // Key Metrics
  const totalOrders = orders.length;
  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + o.sellingPrice, 0), [orders]);
  const totalOrderCosts = useMemo(() => orders.reduce((s, o) => s + o.totalCost, 0), [orders]);
  const totalNetProfit = useMemo(() => orders.reduce((s, o) => s + o.netProfit, 0), [orders]);
  const avgMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

  const totalStockUnits = useMemo(() => products.reduce((s, p) => s + p.stock, 0), [products]);
  const stockValuation = useMemo(() => products.reduce((s, p) => s + p.unitCost * p.stock, 0), [products]);

  const customExpensesTotal = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const lowStockItems = useMemo(() => products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert), [products]);
  const outOfStockItems = useMemo(() => products.filter((p) => p.stock <= 0), [products]);

  const recentOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  }, [orders]);

  // Profit trend over last 7 days
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

      const dayOrders = orders.filter((o) => o.orderDate === dateStr);
      const dayProfit = dayOrders.reduce((sum, o) => sum + o.netProfit, 0);
      const daySales = dayOrders.reduce((sum, o) => sum + o.sellingPrice, 0);

      result.push({
        date: dateStr,
        day: dayLabel,
        profit: dayProfit,
        sales: daySales,
        orders: dayOrders.length,
      });
    }
    return result;
  }, [orders]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToTab('new-order')}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Order</span>
        </button>
      </div>

      {/* Stock Alert if any */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-900">
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
            onClick={() => onNavigateToTab('stock-list')}
            className="text-amber-800 font-bold hover:underline shrink-0"
          >
            Check Stock &rarr;
          </button>
        </div>
      )}

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Profit */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Net Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {formatCurrency(totalNetProfit)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Margin: <span className="font-bold font-mono text-emerald-600">{formatPercent(avgMargin)}</span>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Sales</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            From <span className="font-bold font-mono">{totalOrders}</span> orders
          </div>
        </div>

        {/* Total Costs */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Costs</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-800">
            {formatCurrency(totalOrderCosts)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 truncate">
            Products + Delivery + Packaging
          </div>
        </div>

        {/* Stock Value */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Stock Value</span>
            <Boxes className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900">
            {formatCurrency(stockValuation)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            <span className="font-bold font-mono text-emerald-700">{totalStockUnits}</span> items in inventory
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
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
            Recent Orders
          </h2>
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
