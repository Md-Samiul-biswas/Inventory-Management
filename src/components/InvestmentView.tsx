import React, { useMemo } from 'react';
import {
  TrendingUp,
  Boxes,
  PiggyBank,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { ProductItem, Order, ExpenseItem } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface InvestmentViewProps {
  products: ProductItem[];
  orders: Order[];
  expenses: ExpenseItem[];
}

export const InvestmentView: React.FC<InvestmentViewProps> = ({
  products,
  orders,
  expenses,
}) => {
  // Current Capital locked in Inventory Stock
  const stockCapital = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock * p.unitCost, 0);
  }, [products]);

  // Total Capital deployed on fulfilled orders
  const ordersCostCapital = useMemo(() => {
    return orders.reduce((acc, o) => acc + o.totalCost, 0);
  }, [orders]);

  // Other logged business expenses
  const customExpensesTotal = useMemo(() => {
    return expenses.reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  // Total Capital Deployed = Current Inventory Capital + Order fulfillment Costs + Other Business Expenses
  const totalCapitalInvested = stockCapital + ordersCostCapital + customExpensesTotal;

  // Total Returns = Total Order Sales
  const totalSalesRevenue = useMemo(() => {
    return orders.reduce((acc, o) => acc + o.sellingPrice, 0);
  }, [orders]);

  // Net Profit realized from sales
  const netProfitRealized = useMemo(() => {
    return orders.reduce((acc, o) => acc + o.netProfit, 0);
  }, [orders]);

  // Overall Business Net = Sales Revenue - (Orders fulfillment + Other Expenses)
  const businessNetGain = totalSalesRevenue - (ordersCostCapital + customExpensesTotal);

  // Overall ROI %
  const roiPercent =
    totalCapitalInvested > 0 ? (netProfitRealized / totalCapitalInvested) * 100 : 0;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Investment & Capital</h1>
        </div>
      </div>

      {/* 4 Primary Investment Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stock Capital */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Inventory Capital</span>
            <Boxes className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">
            {formatCurrency(stockCapital)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Capital currently in physical stock
          </div>
        </div>

        {/* Total Capital Deployed */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Total Capital</span>
            <PiggyBank className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">
            {formatCurrency(totalCapitalInvested)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Stock + Order costs + Overheads
          </div>
        </div>

        {/* Realized Sales Revenue */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Sales Returns</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {formatCurrency(totalSalesRevenue)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Recovered from {orders.length} orders
          </div>
        </div>

        {/* ROI % */}
        <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-300 shadow-2xs">
          <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Net Profit (ROI)</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">
            {formatCurrency(netProfitRealized)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Return on Capital: {formatPercent(roiPercent)}
          </div>
        </div>
      </div>

      {/* Capital Distribution Breakdown */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4 shadow-2xs">
        <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
          Capital Allocation Breakdown
        </h2>

        <div className="space-y-3">
          {/* Active Inventory Capital */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-neutral-800">1. Current Stock Inventory (Unsold Asset)</span>
              <span className="font-mono font-bold text-neutral-900">
                {formatCurrency(stockCapital)} (
                {totalCapitalInvested > 0 ? ((stockCapital / totalCapitalInvested) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{
                  width: `${totalCapitalInvested > 0 ? (stockCapital / totalCapitalInvested) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Orders Cost */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-neutral-800">2. Fulfilled Orders Cost (Delivered Goods & Shipping)</span>
              <span className="font-mono font-bold text-neutral-900">
                {formatCurrency(ordersCostCapital)} (
                {totalCapitalInvested > 0 ? ((ordersCostCapital / totalCapitalInvested) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${totalCapitalInvested > 0 ? (ordersCostCapital / totalCapitalInvested) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Other Business Expenses */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-neutral-800">3. Operational Overheads & Marketing</span>
              <span className="font-mono font-bold text-neutral-900">
                {formatCurrency(customExpensesTotal)} (
                {totalCapitalInvested > 0 ? ((customExpensesTotal / totalCapitalInvested) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full"
                style={{
                  width: `${totalCapitalInvested > 0 ? (customExpensesTotal / totalCapitalInvested) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70 text-xs text-neutral-600 flex justify-between items-center">
          <span>Formula:</span>
          <span className="font-mono font-medium text-neutral-800">
            Net Profit = Total Sales - (Product Costs + Delivery + Packaging)
          </span>
        </div>
      </div>
    </div>
  );
};
