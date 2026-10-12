import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  TrendingDown,
  X,
  Package,
  Truck,
  Box,
} from 'lucide-react';
import { ExpenseItem, Order } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ExpensesViewProps {
  expenses: ExpenseItem[];
  orders: Order[];
  onAddExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  orders,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseItem['category']>('Packaging');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Orders automated expenses
  const orderProductCost = useMemo(() => orders.reduce((s, o) => s + o.totalProductCost, 0), [orders]);
  const orderDeliveryCost = useMemo(() => orders.reduce((s, o) => s + o.transportCost, 0), [orders]);
  const orderPackagingCost = useMemo(() => orders.reduce((s, o) => s + o.packagingCost, 0), [orders]);
  const totalOrderExpenses = orderProductCost + orderDeliveryCost + orderPackagingCost;

  // Custom recorded expenses
  const totalCustomExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const grandTotalExpenses = totalOrderExpenses + totalCustomExpenses;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter expense title');
      return;
    }
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      title: title.trim(),
      category,
      amount: amt,
      date,
      note: note.trim() || undefined,
    };

    onAddExpense(newExp);
    setIsModalOpen(false);
    setTitle('');
    setAmount('');
    setNote('');
    setError('');
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Expenses</h1>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* 3 Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Grand Total Expenses</div>
          <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">
            {formatCurrency(grandTotalExpenses)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Orders + Custom logged expenses
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Order Direct Expenses</div>
          <div className="text-2xl font-bold font-mono text-neutral-800 mt-1">
            {formatCurrency(totalOrderExpenses)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Products + Delivery + Packaging
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Other Business Expenses</div>
          <div className="text-2xl font-bold font-mono text-neutral-800 mt-1">
            {formatCurrency(totalCustomExpenses)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Marketing, shop materials & other
          </div>
        </div>
      </div>

      {/* Expense Categories Breakdown */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3 shadow-2xs">
        <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
          Expense Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-neutral-500 font-medium">Product Cost (Orders)</div>
              <div className="text-sm font-bold font-mono text-neutral-900">{formatCurrency(orderProductCost)}</div>
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-neutral-500 font-medium">Delivery Fees</div>
              <div className="text-sm font-bold font-mono text-neutral-900">{formatCurrency(orderDeliveryCost)}</div>
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-neutral-500 font-medium">Packaging & Boxes</div>
              <div className="text-sm font-bold font-mono text-neutral-900">{formatCurrency(orderPackagingCost)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Logged Business Expenses Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            Logged Business Expenses List
          </h2>
          <span className="text-xs text-neutral-400 font-mono">{expenses.length} entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Expense Title</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Note</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-neutral-400">
                    No custom expenses logged. Click "Add Expense" to log overheads.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-neutral-500">
                      {exp.date}
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-900">
                      {exp.title}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-neutral-500 max-w-[200px] truncate">
                      {exp.note || '-'}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-rose-700 text-sm">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50">
              <h3 className="font-bold text-neutral-900 text-sm">Add New Expense</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Expense Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Courier advance deposit, Facebook Ads"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Packaging">Packaging</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Product Restock">Product Restock</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Rent & Utilities">Rent & Utilities</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Amount (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Additional details..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
