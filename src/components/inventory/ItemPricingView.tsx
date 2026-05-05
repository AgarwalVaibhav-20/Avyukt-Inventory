import React, { useState, useEffect } from 'react';
import { productService } from '@/services/productService';
import { InventoryItem } from '@/types';
import { DollarSign, Save, Search, Loader2 } from 'lucide-react';

const ItemPricingView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Local state for editing row
  const [editValues, setEditValues] = useState({ unitPrice: 0, mrp: 0, salePrice: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await productService.getAllItems();
    setItems(data);
    setLoading(false);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditValues({
      unitPrice: item.unitPrice,
      mrp: item.mrp,
      salePrice: item.salePrice
    });
  };

  const handleSave = async (id: string) => {
    await productService.updateItemPricing(id, editValues);
    setEditingId(null);
    loadData();
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="text-green-600" size={20}/> Item Pricing Master
            </h2>
            <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                <input 
                    type="text" 
                    placeholder="Search SKU or Name..." 
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4">Item Details</th>
                        <th className="px-6 py-4">Cost Price (CPU)</th>
                        <th className="px-6 py-4">MRP</th>
                        <th className="px-6 py-4">Sale Price</th>
                        <th className="px-6 py-4">Margin</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline mr-2"/> Loading...</td></tr>
                    ) : filteredItems.length === 0 ? (
                        <tr><td colSpan={6} className="py-8 text-center text-slate-500">No items found.</td></tr>
                    ) : (
                        filteredItems.map(item => {
                            const isEditing = editingId === item.id;
                            const margin = item.salePrice > 0 ? ((item.salePrice - item.unitPrice) / item.salePrice) * 100 : 0;
                            
                            return (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-900">{item.name}</p>
                                        <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                                    </td>
                                    
                                    {/* Cost Price */}
                                    <td className="px-6 py-4">
                                        {isEditing ? (
                                            <input 
                                                type="number" className="w-24 border rounded px-2 py-1"
                                                value={editValues.unitPrice}
                                                onChange={e => setEditValues({...editValues, unitPrice: parseFloat(e.target.value)})}
                                            />
                                        ) : `$${item.unitPrice.toFixed(2)}`}
                                    </td>

                                    {/* MRP */}
                                    <td className="px-6 py-4">
                                        {isEditing ? (
                                            <input 
                                                type="number" className="w-24 border rounded px-2 py-1"
                                                value={editValues.mrp}
                                                onChange={e => setEditValues({...editValues, mrp: parseFloat(e.target.value)})}
                                            />
                                        ) : `$${item.mrp.toFixed(2)}`}
                                    </td>

                                    {/* Sale Price */}
                                    <td className="px-6 py-4 font-bold text-blue-600">
                                        {isEditing ? (
                                            <input 
                                                type="number" className="w-24 border border-blue-300 rounded px-2 py-1"
                                                value={editValues.salePrice}
                                                onChange={e => setEditValues({...editValues, salePrice: parseFloat(e.target.value)})}
                                            />
                                        ) : `$${item.salePrice.toFixed(2)}`}
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-medium px-2 py-1 rounded ${margin >= 20 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {margin.toFixed(1)}%
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        {isEditing ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleSave(item.id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={16}/></button>
                                                <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline text-sm">Edit</button>
                                        )}
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

export default ItemPricingView;
