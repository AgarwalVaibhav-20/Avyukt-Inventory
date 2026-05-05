import React, { useEffect, useState } from 'react';
import { productService } from '@/services/productService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchItems } from '@/store/slices/inventorySlice';
import { InventoryItem } from '@/types';
import { Plus, Filter, Download, Edit, Trash2, Loader2, Search } from 'lucide-react';

const ItemMaster: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.inventory);
  const [search, setSearch] = useState('');

  // Fetch Data from Redux
  const loadItems = () => {
    dispatch(fetchItems());
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
    // Quick add simulation for demo
    const name = prompt("Enter Item Name:");
    if (!name) return;
    const sku = prompt("Enter SKU:");
    if (!sku) return;
        try {
            await productService.createItem({
                name,
                type: 'goods', // required by backend
                sku,
                category: 'Uncategorized',
                brand: 'Generic',
                uom: 'pcs',
                stock: 0,
                consignmentStock: 0,
                reorderLevel: 10,
                unitPrice: 0,
                mrp: 0,
                salePrice: 0,
                hsnCode: '0000',
                barcode: '',
                // backend expects enum values: 'in-stock'|'low-stock'|'out-of-stock'
                status: 'out-of-stock',
                lastUpdated: new Date().toISOString().split('T')[0]
            });
        } catch (err: any) {
            alert(err.response?.data?.message || err.message || 'Failed to add item');
            return;
        }
    loadItems();
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
       {/* Actions Bar */}
       <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-2">
             <button 
                onClick={handleAddItem}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
             >
                <Plus size={16} /> Add New Item
             </button>
             <button className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium">
                <Download size={16} /> Import/Export
             </button>
          </div>
          <div className="flex items-center gap-2">
             <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                <Filter size={20} />
             </button>
             <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search SKU or Name..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-64"
                />
             </div>
          </div>
       </div>

       {/* Table */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 font-medium">Item Details</th>
                        <th className="px-6 py-4 font-medium">Category / Brand</th>
                        <th className="px-6 py-4 font-medium">Stock Level</th>
                        <th className="px-6 py-4 font-medium">Pricing (Cost/Sale)</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900">{item.name}</span>
                                    <div className="flex gap-2">
                                        <span className="text-xs text-slate-500">SKU: {item.sku}</span>
                                        {item.barcode && <span className="text-xs text-slate-400">| BC: {item.barcode}</span>}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                                <div className="flex flex-col">
                                    <span>{item.category}</span>
                                    <span className="text-xs text-slate-400">{item.brand}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
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
                            <td className="px-6 py-4 text-slate-700">
                                <div className="flex flex-col">
                                    <span className="font-medium">${item.salePrice.toFixed(2)}</span>
                                    <span className="text-xs text-slate-400">Cost: ${item.unitPrice.toFixed(2)}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`
                                    px-2.5 py-1 rounded-full text-xs font-medium border
                                    ${item.status === 'In Stock' ? 'bg-green-50 text-green-700 border-green-100' : ''}
                                    ${item.status === 'Low Stock' ? 'bg-amber-50 text-amber-700 border-amber-100' : ''}
                                    ${item.status === 'Out of Stock' ? 'bg-red-50 text-red-700 border-red-100' : ''}
                                `}>
                                    {item.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
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
                    )))}
                </tbody>
            </table>
          </div>
       </div>
    </div>
  );
};

export default ItemMaster;
