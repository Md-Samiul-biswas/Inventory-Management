import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { ProductItem } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface ProductListViewProps {
  products: ProductItem[];
  onAddProduct: (prod: ProductItem) => void;
  onUpdateProduct: (prod: ProductItem) => void;
  onDeleteProduct: (prodId: string) => void;
}

export const ProductListView: React.FC<ProductListViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [modalMode, setModalMode] = useState<'none' | 'add' | 'edit'>('none');
  const [editingProd, setEditingProd] = useState<ProductItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Chocolates');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(10);
  const [unit, setUnit] = useState('pcs');
  const [sku, setSku] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

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
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCat]);

  const openAdd = () => {
    setModalMode('add');
    setEditingProd(null);
    setName('');
    setCategory(categories[0] || 'General');
    setUnitCost('');
    setSellingPrice('');
    setStock(10);
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
    setUnit(p.unit);
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
        minStockAlert: 5,
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
        unit: unit.trim() || 'pcs',
        sku: sku.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    setModalMode('none');
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Product List</h1>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-neutral-200 p-3 flex flex-col sm:flex-row gap-3 shadow-2xs">
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs outline-none text-neutral-800 placeholder:text-neutral-400"
          />
        </div>

        <div className="sm:w-48">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none font-medium"
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

      {/* Products Table */}
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
                <th className="py-3 px-3 text-center">In Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-neutral-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const profit = prod.suggestedSellingPrice - prod.unitCost;
                  const margin = prod.suggestedSellingPrice > 0 ? (profit / prod.suggestedSellingPrice) * 100 : 0;

                  return (
                    <tr key={prod.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-900 text-sm">{prod.name}</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          Unit: {prod.unit}
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

                      {/* Stock */}
                      <td className="py-3 px-3 text-center whitespace-nowrap font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            prod.stock <= 0
                              ? 'bg-rose-100 text-rose-800'
                              : prod.stock <= 5
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-neutral-100 text-neutral-800'
                          }`}
                        >
                          {prod.stock}
                        </span>
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
                    Cost Price (Cost ৳) <span className="text-rose-500">*</span>
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

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Initial Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) =>
                    setStock(e.target.value === '' ? '' : Number(e.target.value))
                  }
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
