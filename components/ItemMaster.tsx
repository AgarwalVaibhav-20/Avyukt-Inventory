import React, { useEffect, useState } from 'react';
import { productService } from '../services/productService';
import { InventoryItem } from '../types';
import { Plus, Filter, Download, Edit, Trash2, Loader2, Search, Save, X } from 'lucide-react';

const ItemMaster: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: 'Uncategorized',
        brand: 'Generic',
        uom: 'pcs',
        unitPrice: 0,
        salePrice: 0,
        reorderLevel: 10,
    });

  // Fetch Data from Backend
  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await productService.getAllItems();
      setItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleDelete = async (id: string) => {
    if(confirm('Are you sure you want to delete this item?')) {
        await productService.deleteItem(id);
        loadItems();
    }
  };

    const handleAddItem = async () => {
        // Open modal form
        setShowForm(true);
    };

    const handleSaveItem = async () => {
        if (!formData.name.trim() || !formData.sku.trim()) {
            alert('Item Name and SKU are required');
            return;
        }

        await productService.createItem({
            name: formData.name,
            sku: formData.sku,
            category: formData.category,
            brand: formData.brand,
            uom: formData.uom,
            stock: 0,
            consignmentStock: 0,
            reorderLevel: formData.reorderLevel,
            unitPrice: formData.unitPrice,
            mrp: 0,
            salePrice: formData.salePrice,
            hsnCode: '',
            barcode: '',
            status: 'Out of Stock',
            lastUpdated: new Date().toISOString().split('T')[0],
            isActive: true,
        });
        setShowForm(false);
        setFormData({ name: '', sku: '', category: 'Uncategorized', brand: 'Generic', uom: 'pcs', unitPrice: 0, salePrice: 0, reorderLevel: 10 });
        loadItems();
    };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.sku.toLowerCase().includes(search.toLowerCase())
  );
    const lowStockCount = items.filter(item => item.stock <= item.reorderLevel).length;

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleAddItem}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={16} /> Add New Item
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            <Download size={16} /> Import/Export
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50">
            <Filter size={20} />
          </button>
          <div className="relative w-full max-w-xs sm:w-80">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search SKU or Name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Add Item Modal */}
        {showForm && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowForm(false)} />
            <div className="relative w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Add New Item</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label>
                  <input type="text" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                  <input type="text" value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">UoM</label>
                  <input type="text" value={formData.uom} onChange={(e) => setFormData({...formData, uom: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price</label>
                  <input type="number" value={formData.unitPrice} onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value || '0')})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price</label>
                  <input type="number" value={formData.salePrice} onChange={(e) => setFormData({...formData, salePrice: parseFloat(e.target.value || '0')})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
                  <input type="number" value={formData.reorderLevel} onChange={(e) => setFormData({...formData, reorderLevel: parseInt(e.target.value || '0')})} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleSaveItem} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><Save size={16} /> Save Item</button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3 sm:px-6">Item Details</th>
                <th className="px-4 py-3 sm:px-6">Category / Brand</th>
                <th className="px-4 py-3 sm:px-6">Stock Level</th>
                <th className="px-4 py-3 sm:px-6">Pricing (Cost/Sale)</th>
                <th className="px-4 py-3 sm:px-6">Status</th>
                <th className="px-4 py-3 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={20} /> Loading Inventory...
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-slate-500">No items found</td></tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{item.name}</span>
                        <div className="flex gap-2">
                          <span className="text-xs text-slate-500">SKU: {item.sku}</span>
                          {item.barcode && <span className="text-xs text-slate-400">| BC: {item.barcode}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-6 text-slate-600">
                      <div className="flex flex-col">
                        <span>{item.category}</span>
                        <span className="text-xs text-slate-400">{item.brand}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${item.stock <= item.reorderLevel ? 'text-red-600' : 'text-slate-700'}`}>
                          {item.stock} {item.uom}
                        </span>
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${item.stock <= item.reorderLevel ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min((item.stock / (Math.max(item.reorderLevel, 1) * 3)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-6 text-slate-700">
                      <div className="flex flex-col">
                        <span className="font-medium">${item.salePrice.toFixed(2)}</span>
                        <span className="text-xs text-slate-400">Cost: ${item.unitPrice.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <span className={`
                        px-2.5 py-1 rounded-lg text-xs font-medium border
                        ${item.status === 'In Stock' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                        ${item.status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                        ${item.status === 'Out of Stock' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                      `}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ItemMaster;