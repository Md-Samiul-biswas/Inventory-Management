import React, { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  Trash2,
  Plus,
  Calendar,
  Phone,
  Download,
  ShoppingBag,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { formatCurrency, formatPercent, STATUS_MAP } from '../utils/formatters';

interface OrdersListViewProps {
  orders: Order[];
  onOpenOrderDetails: (order: Order) => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  onDeleteOrder: (orderId: string) => void;
  onAddNewOrder: () => void;
}

export const OrdersListView: React.FC<OrdersListViewProps> = ({
  orders,
  onOpenOrderDetails,
  onUpdateStatus,
  onDeleteOrder,
  onAddNewOrder,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const matchSearch =
          o.customerName.toLowerCase().includes(search.toLowerCase()) ||
          o.customerPhone.includes(search) ||
          o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          o.packageTitle.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, search, statusFilter]);

  // Totals
  const totalRev = useMemo(() => orders.reduce((s, o) => s + o.sellingPrice, 0), [orders]);
  const totalCost = useMemo(() => orders.reduce((s, o) => s + o.totalCost, 0), [orders]);
  const totalProfit = useMemo(() => orders.reduce((s, o) => s + o.netProfit, 0), [orders]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Order Number',
      'Date',
      'Customer',
      'Phone',
      'Address',
      'Package Title',
      'Items',
      'Product Cost',
      'Delivery Cost',
      'Packaging Cost',
      'Total Cost',
      'Selling Price',
      'Net Profit',
      'Status',
    ];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      o.orderDate,
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      `"${o.customerAddress}"`,
      `"${o.packageTitle}"`,
      `"${o.items.map((i) => `${i.quantity}x ${i.productName}`).join('; ')}"`,
      o.totalProductCost,
      o.transportCost,
      o.packagingCost,
      o.totalCost,
      o.sellingPrice,
      o.netProfit,
      o.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Order Management</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 border border-neutral-200 bg-white rounded-xl cursor-pointer"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={onAddNewOrder}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider truncate">Total Orders</div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-neutral-900 mt-1 truncate">
            {orders.length} <span className="text-xs font-normal text-neutral-500">orders</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider truncate">Total Costs</div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-neutral-800 mt-1 truncate">
            {formatCurrency(totalCost)}
          </div>
        </div>

        <div className="bg-emerald-50/70 p-3.5 sm:p-4 rounded-xl border border-emerald-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[10px] sm:text-xs text-emerald-800 font-bold uppercase tracking-wider truncate">Total Net Profit</div>
          <div className="text-lg sm:text-2xl font-extrabold font-mono text-emerald-900 mt-1 truncate">
            {formatCurrency(totalProfit)}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-3 flex flex-col sm:flex-row gap-3 shadow-2xs">
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or order number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs outline-none text-neutral-800 placeholder:text-neutral-400"
          />
        </div>

        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none font-medium"
          >
            <option value="all">All Statuses ({orders.length})</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="packaging">Packaging</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Order # & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Package Contents</th>
                <th className="py-3 px-3 text-right">Cost</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-right">Net Profit</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-neutral-400">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const statusInfo = STATUS_MAP[ord.status] || STATUS_MAP.pending;

                  return (
                    <tr key={ord.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Order No & Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold font-mono text-neutral-900 text-sm">
                          {ord.orderNumber}
                        </div>
                        <div className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{ord.orderDate}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-900">{ord.customerName}</div>
                        <div className="text-[11px] text-neutral-500 font-mono">
                          {ord.customerPhone}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4 max-w-[260px]">
                        <div className="text-neutral-800 line-clamp-2">
                          {ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-neutral-700">
                        {formatCurrency(ord.totalCost)}
                      </td>

                      {/* Selling */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-neutral-900 text-sm">
                        {formatCurrency(ord.sellingPrice)}
                      </td>

                      {/* Profit */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div
                          className={`font-mono font-bold text-sm ${
                            ord.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          +{formatCurrency(ord.netProfit)}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-mono">
                          {ord.sellingPrice > 0 ? `${((ord.netProfit / ord.sellingPrice) * 100).toFixed(0)}% margin` : ''}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <select
                          value={ord.status}
                          onChange={(e) =>
                            onUpdateStatus(ord.id, e.target.value as OrderStatus)
                          }
                          className={`px-2 py-1 text-[11px] font-bold rounded-lg border focus:outline-none cursor-pointer ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="packaging">Packaging</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenOrderDetails(ord)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg cursor-pointer"
                            title="Receipt / Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteOrder(ord.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
