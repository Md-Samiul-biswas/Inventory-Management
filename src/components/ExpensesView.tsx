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
  Megaphone,
  Home,
  Layers,
} from 'lucide-react';
import { ExpenseItem, Order } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ExpensesViewProps {
  expenses: ExpenseItem[];
  orders?: Order[];
  onAddExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  orders = [],
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

  // Real logged custom business expenses
  const totalExpenses = useMemo(() => {
    return expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // e.g. "2026-10"
  const thisMonthExpenses = useMemo(() => {
    return expenses
      .filter((e) => (e.date || '').startsWith(currentMonthPrefix))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [expenses, currentMonthPrefix]);

  const avgExpensePerEntry = useMemo(() => {
    if (expenses.length === 0) return 0;
    return Math.round(totalExpenses / expenses.length);
  }, [expenses.length, totalExpenses]);

  // Breakdown by logged categories (only calculated when expenses exist)
  const categoryBreakdown = useMemo(() => {
    if (expenses.length === 0) return [];

    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
    });

    return Object.entries(map).map(([name, total]) => ({
      name,
      total,
    }));
  }, [expenses]);

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

  const getCategoryIcon = (catName: string) => {
    switch (catName) {
      case 'Packaging':
        return <Box className="w-4 h-4 text-purple-600" />;
      case 'Delivery':
        return <Truck className="w-4 h-4 text-amber-600" />;
      case 'Product Restock':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'Marketing':
        return <Megaphone className="w-4 h-4 text-rose-600" />;
      case 'Rent & Utilities':
        return <Home className="w-4 h-4 text-indigo-600" />;
      default:
        return <Receipt className="w-4 h-4 text-neutral-600" />;
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Expenses</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            ব্যবসার নিয়মিত খরচসমূহ (ওভারহেড ও পরিচালন ব্যয়)
          </p>
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

      {/* 3 Overview Cards - Based STRICTLY on logged expenses */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider truncate">
            Total Business Expenses
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-neutral-900 mt-1 truncate">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 truncate">
            {expenses.length > 0 ? `${expenses.length} entries recorded` : 'কোনো খরচ এন্ট্রি নেই'}
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider truncate">
            This Month's Expenses
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-neutral-800 mt-1 truncate">
            {formatCurrency(thisMonthExpenses)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 truncate">
            Current month overheads
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider truncate">
            Average / Entry
          </div>
          <div className="text-lg sm:text-2xl font-bold font-mono text-neutral-800 mt-1 truncate">
            {formatCurrency(avgExpensePerEntry)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 truncate">
            {expenses.length > 0 ? 'গড় প্রতি খরচ' : 'N/A'}
          </div>
        </div>
      </div>

      {/* Expense Categories Breakdown - ONLY SHOWN WHEN EXPENSES EXIST */}
      {expenses.length > 0 && categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3 shadow-2xs">
          <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            Expense Categories (খরচের ক্যাটাগরি)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.name}
                className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shrink-0">
                  {getCategoryIcon(cat.name)}
                </div>
                <div>
                  <div className="text-[11px] text-neutral-500 font-medium">
                    {cat.name}
                  </div>
                  <div className="text-sm font-bold font-mono text-neutral-900">
                    {formatCurrency(cat.total)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logged Business Expenses Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            Logged Business Expenses List
          </h2>
          <span className="text-xs text-neutral-500 font-mono font-semibold">
            {expenses.length} entries
          </span>
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
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-400 space-y-1">
                    <Receipt className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                    <p className="font-semibold text-neutral-600">এখনো কোনো খরচ যুক্ত করা হয়নি</p>
                    <p className="text-neutral-400">
                      দোকানের ওভারহেড বা পরিচালন ব্যয় যোগ করতে উপরের "+ Add Expense" বাটনে ক্লিক করুন।
                    </p>
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
                        className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
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
                  placeholder="e.g. Courier advance deposit, Packaging boxes, Facebook Ads"
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
