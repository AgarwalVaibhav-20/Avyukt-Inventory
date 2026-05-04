import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { InventoryItem } from '../types';
import { Plus, Edit2, Trash2, Search, Loader2, Save, X, Package, Info, DollarSign, Tag } from 'lucide-react';

const ItemMasterView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    itemType: 'Finished Goods' as const,
    category: '',
    brand: '',
    uom: '',
    hsnCode: '',
    taxRate: 0,
    shelfLife: 0,
    leadTime: 0,
    unitPrice: 0,
    mrp: 0,
    salePrice: 0,
    reorderLevel: 10,
    reorderQuantity: 50,
    minimumStockLevel: 5,
    maximumStockLevel: 500,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await productService.getAllItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to load items', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async () => {
    if (!formData.name.trim() || !formData.sku.trim()) {
      alert('Item Name and SKU are required');
      return;
    }

    try {
      if (editingId) {
        await productService.updateItem(editingId, {
          ...formData,
          reorderLevel: formData.reorderLevel,
          unitPrice: formData.unitPrice,
          mrp: formData.mrp,
          salePrice: formData.salePrice,
        });
      } else {
        await productService.createItem({
          ...formData,
          stock: 0,
          consignmentStock: 0,
          status: 'Out of Stock',
          lastUpdated: new Date().toISOString().split('T')[0],
          isActive: true,
        });
      }
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save item', error);
      alert('Failed to save item');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await productService.deleteItem(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete item', error);
        alert('Failed to delete item');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      itemType: 'Finished Goods',
      category: '',
      brand: '',
      uom: '',
      hsnCode: '',
      taxRate: 0,
      shelfLife: 0,
      leadTime: 0,
      unitPrice: 0,
      mrp: 0,
      salePrice: 0,
      reorderLevel: 10,
      reorderQuantity: 50,
      minimumStockLevel: 5,
      maximumStockLevel: 500,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredItems = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || i.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: items.length,
    active: items.filter(i => i.isActive).length,
    outOfStock: items.filter(i => i.status === 'Out of Stock').length,
    lowStock: items.filter(i => i.status === 'Low Stock').length,
    value: items.reduce((sum, i) => sum + (i.unitPrice * i.stock), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Item Master</h2>
          <p className="text-sm text-slate-500">The single source of truth for all products and SKUs</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} /> Add Item
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4">
          <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-slate-600">Total Items</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
          <div className="text-3xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-slate-600">Active Items</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200 p-4">
          <div className="text-3xl font-bold text-orange-600">{stats.lowStock}</div>
          <div className="text-sm text-slate-600">Low Stock</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border border-red-200 p-4">
          <div className="text-3xl font-bold text-red-600">{stats.outOfStock}</div>
          <div className="text-sm text-slate-600">Out of Stock</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-4">
          <div className="text-3xl font-bold text-purple-600">₹{(stats.value / 100000).toFixed(1)}L</div>
          <div className="text-sm text-slate-600">Stock Value</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by item name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Status</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 space-y-4 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center sticky top-0 bg-white">
            <h3 className="text-lg font-bold text-slate-800">
              {editingId ? 'Edit Item' : 'Add New Item'}
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Product name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="SKU code"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Product description"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Item Type *</label>
              <select
                value={formData.itemType}
                onChange={(e) => setFormData({ ...formData, itemType: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Raw Material">Raw Material</option>
                <option value="Finished Goods">Finished Goods</option>
                <option value="Semi-Finished">Semi-Finished</option>
                <option value="Consumable">Consumable</option>
                <option value="Trading">Trading</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Category"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Brand name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">UoM</label>
              <input
                type="text"
                value={formData.uom}
                onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Pcs, Kg, L"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">HSN Code</label>
              <input
                type="text"
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 8517.62"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price (₹)</label>
              <input
                type="number"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">MRP (₹)</label>
              <input
                type="number"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price (₹)</label>
              <input
                type="number"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
              <input
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Quantity</label>
              <input
                type="number"
                value={formData.reorderQuantity}
                onChange={(e) => setFormData({ ...formData, reorderQuantity: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Shelf Life (days)</label>
              <input
                type="number"
                value={formData.shelfLife}
                onChange={(e) => setFormData({ ...formData, shelfLife: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Lead Time (days)</label>
              <input
                type="number"
                value={formData.leadTime}
                onChange={(e) => setFormData({ ...formData, leadTime: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 sticky bottom-0 bg-white">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveItem}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save size={16} /> Save Item
            </button>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="animate-spin inline mr-2" />
            Loading items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            {search ? 'No items found matching your search.' : 'No items yet. Create one to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Item Details</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Prices</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500">SKU: {item.sku}</div>
                    </td>
                    <td className="px-6 py-4">{item.itemType}</td>
                    <td className="px-6 py-4">{item.category}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        <div>CP: ₹{item.unitPrice.toFixed(2)}</div>
                        <div className="font-medium text-green-600">SP: ₹{item.salePrice.toFixed(2)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${
                          item.status === 'In Stock'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : item.status === 'Low Stock'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setFormData({
                              name: item.name,
                              sku: item.sku,
                              description: item.description || '',
                              itemType: item.itemType,
                              category: item.category,
                              brand: item.brand,
                              uom: item.uom,
                              hsnCode: item.hsnCode,
                              taxRate: item.taxRate || 0,
                              shelfLife: item.shelfLife || 0,
                              leadTime: item.leadTime || 0,
                              unitPrice: item.unitPrice,
                              mrp: item.mrp,
                              salePrice: item.salePrice,
                              reorderLevel: item.reorderLevel,
                              reorderQuantity: item.reorderQuantity || 50,
                              minimumStockLevel: item.minimumStockLevel || 5,
                              maximumStockLevel: item.maximumStockLevel || 500,
                            });
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemMasterView;
