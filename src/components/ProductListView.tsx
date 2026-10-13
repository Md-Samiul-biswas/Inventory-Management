import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Check,
  TrendingUp,
  Package,
  RefreshCw,
  ArrowUpDown,
  Coins,
} from 'lucide-react';
import { ProductItem } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface ProductListViewProps {
  products: ProductItem[];
  onAddProduct: (prod: ProductItem) => void;
  onUpdateProduct: (prod: ProductItem) => void;
  onDeleteProduct: (prodId: string) => void;
  onRestockProduct?: (prodId: string, delta: number) => void;
  onSetProductStock?: (prodId: string, newStock: number) => void;
  initialTab?: 'products' | 'stock';
}

export const ProductListView: React.FC<ProductListViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRestockProduct,
  onSetProductStock,
  initialTab = 'products',
}) => {
  // 2 Sub-Tabs: 'products' and 'stock'
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'stock'>(initialTab);

  // Common Filters
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  // Stock Tab Filter
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');

  // Modal State
  const [modalMode, setModalMode] = useState<'none' | 'add' | 'edit'>('none');
  const [editingProd, setEditingProd] = useState<ProductItem | null>(null);

  // Inline stock editing states
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineStockVal, setInlineStockVal] = useState<string>('');

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Chocolates');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(10);
  const [minStockAlert, setMinStockAlert] = useState<number | ''>(5);
  const [unit, setUnit] = useState('pcs');
  const [sku, setSku] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Metrics
  const totalUnits = useMemo(() => products.reduce((acc, p) => acc + (p.stock || 0), 0), [products]);
  const totalValuation = useMemo(() => products.reduce((acc, p) => acc + (p.unitCost || 0) * (p.stock || 0), 0), [products]);
  const lowCount = useMemo(() => products.filter((p) => p.stock > 0 && p.stock <= (p.minStockAlert ?? 5)).length, [products]);
  const outCount = useMemo(() => products.filter((p) => (p.stock || 0) <= 0).length, [products]);
  const inStockCount = useMemo(() => products.filter((p) => (p.stock || 0) > (p.minStockAlert ?? 5)).length, [products]);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category)));
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

      const matchCat = selectedCat === 'all' || p.category === selectedCat;

      if (activeSubTab === 'stock') {
        const threshold = p.minStockAlert ?? 5;
        let matchStock = true;
        if (stockFilter === 'in-stock') matchStock = (p.stock || 0) > threshold;
        if (stockFilter === 'low-stock') matchStock = (p.stock || 0) > 0 && (p.stock || 0) <= threshold;
        if (stockFilter === 'out-of-stock') matchStock = (p.stock || 0) <= 0;
        return matchSearch && matchCat && matchStock;
      }

      return matchSearch && matchCat;
    });
  }, [products, search, selectedCat, activeSubTab, stockFilter]);

  const openAdd = () => {
    setModalMode('add');
    setEditingProd(null);
    setName('');
    setCategory(categories[0] || 'General');
    setUnitCost('');
    setSellingPrice('');
    setStock(10);
    setMinStockAlert(5);
    setUnit('pcs');
    setSku('');
    setNotes('');
    setError('');
  };

  const openEdit = (p: ProductItem) => {
    setModalMode('edit');
    setEditingProd(p);
    setName(p.name);
    setCategory(p.category);
    setUnitCost(p.unitCost);
    setSellingPrice(p.suggestedSellingPrice);
    setStock(p.stock);
    setMinStockAlert(p.minStockAlert ?? 5);
    setUnit(p.unit || 'pcs');
    setSku(p.sku || '');
    setNotes(p.notes || '');
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a product name');
      return;
    }
    const cost = Number(unitCost);
    if (isNaN(cost) || cost < 0) {
      setError('Please enter a valid cost price');
      return;
    }
    const sell = Number(sellingPrice) || Math.round(cost * 1.35);

    if (modalMode === 'add') {
      const newP: ProductItem = {
        id: `prod-${Date.now()}`,
        name: name.trim(),
        category: category.trim() || 'General',
        unitCost: cost,
        suggestedSellingPrice: sell,
        stock: Number(stock) || 0,
        minStockAlert: Number(minStockAlert) || 5,
        unit: unit.trim() || 'pcs',
        sku: sku.trim() || undefined,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddProduct(newP);
    } else if (modalMode === 'edit' && editingProd) {
      onUpdateProduct({
        ...editingProd,
        name: name.trim(),
        category: category.trim() || 'General',
        unitCost: cost,
        suggestedSellingPrice: sell,
        stock: Number(stock) || 0,
        minStockAlert: Number(minStockAlert) || 5,
        unit: unit.trim() || 'pcs',
        sku: sku.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    setModalMode('none');
  };

  // Stock quick handlers
  const handleQuickDelta = (prod: ProductItem, delta: number) => {
    if (onRestockProduct) {
      onRestockProduct(prod.id, delta);
    } else {
      const newStock = Math.max(0, prod.stock + delta);
      onUpdateProduct({ ...prod, stock: newStock });
    }
  };

  const startInlineEdit = (prod: ProductItem) => {
    setInlineEditingId(prod.id);
    setInlineStockVal(String(prod.stock));
  };

  const submitInlineStock = (prod: ProductItem) => {
    const val = parseInt(inlineStockVal, 10);
    if (!isNaN(val) && val >= 0) {
      if (onSetProductStock) {
        onSetProductStock(prod.id, val);
      } else {
        onUpdateProduct({ ...prod, stock: val });
      }
    }
    setInlineEditingId(null);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900">
              {activeSubTab === 'products' ? 'Product List' : 'Stock & Inventory'}
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
              {products.length} Products
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {activeSubTab === 'products'
              ? 'পণ্য তালিকা, বিক্রয় মূল্য ও প্রফিট মার্জিন ব্যবস্থাপনা'
              : 'লাইভ স্টক ইনভেন্টরি, রি-স্টক ও স্টক লেভেল আপডেট'}
          </p>
        </div>

        {/* 2 Tabs Controls & Add Product CTA */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('products')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'products'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
              }`}
            >
              <Layers className={`w-4 h-4 ${activeSubTab === 'products' ? 'text-emerald-600' : 'text-neutral-400'}`} />
              <span>Product List</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('stock')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'stock'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
              }`}
            >
              <Boxes className={`w-4 h-4 ${activeSubTab === 'stock' ? 'text-emerald-600' : 'text-neutral-400'}`} />
              <span>Stock Management</span>
              {(lowCount > 0 || outCount > 0) && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {lowCount + outCount}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: PRODUCT LIST
      ========================================================================= */}
      {activeSubTab === 'products' && (
        <div className="space-y-6">
          {/* Product Catalog Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
                <span>Total Products</span>
                <Layers className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900">
                {products.length}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Categories: {categories.length}
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
                <span>Total Units in Stock</span>
                <Boxes className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700">
                {totalUnits} <span className="text-xs font-normal text-neutral-500">pcs</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('stock')}
                className="text-[11px] text-emerald-700 font-bold hover:underline mt-0.5 cursor-pointer block text-left"
              >
                Go to Stock Tab &rarr;
              </button>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
                <span>Inventory Valuation</span>
                <Coins className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900">
                {formatCurrency(totalValuation)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Total at cost price
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
              <div className="flex items-center justify-between text-neutral-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
                <span>Stock Alerts</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold font-mono mt-1">
                <span className="text-amber-700">{lowCount} Low</span>
                <span className="text-neutral-300">·</span>
                <span className="text-rose-700">{outCount} Out</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('stock')}
                className="text-[11px] text-amber-800 font-bold hover:underline mt-0.5 cursor-pointer block text-left"
              >
                Manage in Stock Tab &rarr;
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white rounded-xl border border-neutral-200 p-3 flex flex-col sm:flex-row gap-3 shadow-2xs">
            <div className="flex-1 flex items-center gap-2">
              <Search className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
              <input
                type="text"
                placeholder="Search products by name, category, or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs outline-none text-neutral-800 placeholder:text-neutral-400"
              />
            </div>

            <div className="sm:w-48">
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none font-medium text-neutral-700"
              >
                <option value="all">All Categories ({products.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Catalog Table */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Cost Price</th>
                    <th className="py-3 px-3 text-right">Selling Price</th>
                    <th className="py-3 px-3 text-right">Profit / Margin</th>
                    <th className="py-3 px-3 text-center">Stock Available</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-neutral-400">
                        <Package className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                        কোনো প্রোডাক্ট পাওয়া যায়নি (No products found).
                      </td>
                    </tr>
                  ) : (
                    filtered.map((prod) => {
                      const profit = prod.suggestedSellingPrice - prod.unitCost;
                      const margin = prod.suggestedSellingPrice > 0 ? (profit / prod.suggestedSellingPrice) * 100 : 0;
                      const threshold = prod.minStockAlert ?? 5;
                      const isOut = prod.stock <= 0;
                      const isLow = !isOut && prod.stock <= threshold;

                      return (
                        <tr key={prod.id} className="hover:bg-neutral-50/70 transition-colors">
                          {/* Name */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-neutral-900 text-sm">{prod.name}</div>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                              <span>Unit: <strong className="text-neutral-600">{prod.unit || 'pcs'}</strong></span>
                              {prod.sku && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono text-neutral-500">SKU: {prod.sku}</span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-3 text-neutral-500 whitespace-nowrap">
                            <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-[11px] font-medium">
                              {prod.category}
                            </span>
                          </td>

                          {/* Cost */}
                          <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-neutral-800">
                            {formatCurrency(prod.unitCost)}
                          </td>

                          {/* Selling */}
                          <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-neutral-900">
                            {formatCurrency(prod.suggestedSellingPrice)}
                          </td>

                          {/* Profit */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="font-mono font-bold text-emerald-700">
                              +{formatCurrency(profit)}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-mono">
                              {formatPercent(margin)}
                            </div>
                          </td>

                          {/* Stock Available Badge with link to Stock tab */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSubTab('stock');
                                setSearch(prod.name);
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-bold text-xs cursor-pointer transition-colors ${
                                isOut
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  : isLow
                                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title="স্টক ট্যাবে আপডেট করতে ক্লিক করুন"
                            >
                              <span>{prod.stock}</span>
                              <span className="text-[10px] font-normal text-neutral-500">{prod.unit || 'pcs'}</span>
                            </button>
                            <div className="text-[9px] mt-0.5">
                              {isOut ? (
                                <span className="text-rose-600 font-bold">Out of Stock</span>
                              ) : isLow ? (
                                <span className="text-amber-700 font-bold">Low Stock (≤{threshold})</span>
                              ) : (
                                <span className="text-emerald-700">In Stock</span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEdit(prod)}
                                className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteProduct(prod.id)}
                                className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* =========================================================================
          TAB 2: STOCK & INVENTORY (এখানেই স্টকের সমস্ত বিষয় থাকবে)
      ========================================================================= */}
      {activeSubTab === 'stock' && (
        <div className="space-y-6">
          {/* Stock Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Units */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
              <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider truncate">
                Total Live Stock
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 mt-1 truncate">
                {totalUnits} <span className="text-xs font-normal text-neutral-500">pcs</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Across all products
              </div>
            </div>

            {/* Total Stock Valuation */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
              <div className="text-[10px] sm:text-xs text-neutral-500 font-bold uppercase tracking-wider truncate">
                Total Stock Valuation
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-neutral-900 mt-1 truncate">
                {formatCurrency(totalValuation)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Current inventory value
              </div>
            </div>

            {/* Low Stock Filter Card */}
            <div
              onClick={() => setStockFilter(stockFilter === 'low-stock' ? 'all' : 'low-stock')}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                stockFilter === 'low-stock'
                  ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400'
                  : 'bg-white border-neutral-200 hover:border-amber-300'
              }`}
            >
              <div className="text-[10px] sm:text-xs text-amber-800 font-bold uppercase tracking-wider truncate">
                Low Stock Items
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-700 mt-1">
                {lowCount} <span className="text-xs font-normal text-amber-600">items</span>
              </div>
              <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
                {stockFilter === 'low-stock' ? '✓ Filtering Low Stock' : 'Click to filter'}
              </div>
            </div>

            {/* Out of Stock Filter Card */}
            <div
              onClick={() => setStockFilter(stockFilter === 'out-of-stock' ? 'all' : 'out-of-stock')}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                stockFilter === 'out-of-stock'
                  ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-400'
                  : 'bg-white border-neutral-200 hover:border-rose-300'
              }`}
            >
              <div className="text-[10px] sm:text-xs text-rose-800 font-bold uppercase tracking-wider truncate">
                Out of Stock
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-rose-700 mt-1">
                {outCount} <span className="text-xs font-normal text-rose-600">items</span>
              </div>
              <div className="text-[10px] text-rose-800 font-semibold mt-0.5">
                {stockFilter === 'out-of-stock' ? '✓ Filtering Out of Stock' : 'Click to filter'}
              </div>
            </div>
          </div>

          {/* Filter & Search Bar for Stock */}
          <div className="bg-white rounded-xl border border-neutral-200 p-3 flex flex-col md:flex-row gap-3 shadow-2xs">
            <div className="flex-1 flex items-center gap-2">
              <Search className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
              <input
                type="text"
                placeholder="Search stock by product name, category, or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs outline-none text-neutral-800 placeholder:text-neutral-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none font-medium text-neutral-700"
              >
                <option value="all">All Categories ({products.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div className="inline-flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    stockFilter === 'all'
                      ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  All ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('in-stock')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    stockFilter === 'in-stock'
                      ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  In Stock ({inStockCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('low-stock')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    stockFilter === 'low-stock'
                      ? 'bg-amber-500 text-white shadow-2xs font-bold'
                      : 'text-amber-800 hover:bg-amber-100/50'
                  }`}
                >
                  Low Stock ({lowCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('out-of-stock')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    stockFilter === 'out-of-stock'
                      ? 'bg-rose-600 text-white shadow-2xs font-bold'
                      : 'text-rose-800 hover:bg-rose-100/50'
                  }`}
                >
                  Out of Stock ({outCount})
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Stock Table with Live In-Place Updating */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Unit Cost</th>
                    <th className="py-3 px-3 text-right">Stock Valuation</th>
                    <th className="py-3 px-3 text-center min-w-[200px]">
                      Live Stock Level (আপডেট করুন)
                    </th>
                    <th className="py-3 px-4 text-right">Quick Restock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-neutral-400">
                        <Boxes className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                        এই ফিল্টারে কোনো স্টক পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filtered.map((prod) => {
                      const threshold = prod.minStockAlert ?? 5;
                      const isOut = prod.stock <= 0;
                      const isLow = !isOut && prod.stock <= threshold;
                      const stockValue = prod.stock * prod.unitCost;
                      const isEditingThisStock = inlineEditingId === prod.id;

                      return (
                        <tr key={prod.id} className="hover:bg-neutral-50/70 transition-colors">
                          {/* Name & SKU */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-neutral-900 text-sm">{prod.name}</div>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                              {prod.sku ? `SKU: ${prod.sku}` : `Unit: ${prod.unit || 'pcs'}`}
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-3 text-neutral-500 whitespace-nowrap">
                            <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-[11px] font-medium">
                              {prod.category}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {isOut ? (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                Low (≤{threshold})
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                In Stock
                              </span>
                            )}
                          </td>

                          {/* Unit Cost */}
                          <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-neutral-700">
                            {formatCurrency(prod.unitCost)}
                          </td>

                          {/* Total Valuation */}
                          <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-neutral-900">
                            {formatCurrency(stockValue)}
                          </td>

                          {/* Live Stock Level Stepper & Click-to-edit */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {isEditingThisStock ? (
                              <div className="inline-flex items-center gap-1 bg-white border-2 border-emerald-500 rounded-lg p-0.5 shadow-xs">
                                <input
                                  type="number"
                                  min="0"
                                  autoFocus
                                  value={inlineStockVal}
                                  onChange={(e) => setInlineStockVal(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') submitInlineStock(prod);
                                    if (e.key === 'Escape') setInlineEditingId(null);
                                  }}
                                  className="w-16 text-center font-mono font-bold text-xs py-1 px-1 outline-none text-neutral-900"
                                />
                                <button
                                  type="button"
                                  onClick={() => submitInlineStock(prod)}
                                  className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                                  title="Save"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInlineEditingId(null)}
                                  className="p-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-lg p-1 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleQuickDelta(prod, -1)}
                                  disabled={prod.stock <= 0}
                                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-rose-50 border border-neutral-200 text-neutral-600 hover:text-rose-700 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-sm cursor-pointer transition-colors shadow-2xs"
                                  title="1 কমান (-1)"
                                >
                                  -
                                </button>

                                <button
                                  type="button"
                                  onClick={() => startInlineEdit(prod)}
                                  className={`px-3 py-1 rounded-md font-mono font-bold text-sm min-w-[50px] transition-all cursor-pointer group flex items-center justify-center gap-1 ${
                                    isOut
                                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                      : isLow
                                      ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                  }`}
                                  title="ক্লিক করে সরাসরি সংখ্যা টাইপ করুন"
                                >
                                  <span>{prod.stock}</span>
                                  <span className="text-[10px] text-neutral-400 group-hover:text-neutral-700 font-normal">
                                    {prod.unit || 'pcs'}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleQuickDelta(prod, 1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-emerald-50 border border-neutral-200 text-neutral-600 hover:text-emerald-700 font-bold text-sm cursor-pointer transition-colors shadow-2xs"
                                  title="1 বাড়ান (+1)"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </td>

                          {/* Quick Restock Preset Buttons */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuickDelta(prod, 5)}
                                className="px-2 py-1 text-[11px] font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md cursor-pointer transition-colors"
                                title="+5 স্টক যোগ করুন"
                              >
                                +5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickDelta(prod, 10)}
                                className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md cursor-pointer transition-colors"
                                title="+10 স্টক যোগ করুন"
                              >
                                +10
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickDelta(prod, 25)}
                                className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md cursor-pointer transition-colors"
                                title="+25 স্টক যোগ করুন"
                              >
                                +25
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
      )}

      {/* Add / Edit Modal */}
      {modalMode !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50">
              <h3 className="font-bold text-neutral-900 text-sm">
                {modalMode === 'add' ? 'Add New Product' : 'Edit Product'}
              </h3>
              <button
                onClick={() => setModalMode('none')}
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
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Silk Chocolate, Mug, Rose"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chocolates, Flowers"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    placeholder="pcs, box, pack"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Cost Price (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={unitCost}
                    onChange={(e) =>
                      setUnitCost(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Selling Price (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={sellingPrice}
                    onChange={(e) =>
                      setSellingPrice(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Current Stock Quantity <span className="text-emerald-600 font-semibold">(স্টক)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) =>
                      setStock(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-neutral-900 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Low Stock Alert Limit <span className="text-neutral-400 font-normal">(Default: 5)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="5"
                    value={minStockAlert}
                    onChange={(e) =>
                      setMinStockAlert(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  SKU (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CHO-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setModalMode('none')}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                >
                  {modalMode === 'add' ? 'Save Product' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
