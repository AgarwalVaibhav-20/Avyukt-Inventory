import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { InventoryItem } from '../types';
import { BarChart3, Save, Search, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const ReorderLevelView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLevel, setEditLevel] = useState<number>(0);

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
    setEditLevel(item.reorderLevel);
  };

  const handleSave = async (id: string) => {
    await productService.updateReorderLevel(id, editLevel);
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
                <BarChart3 className="text-blue-600" size={20}/> Reorder Levels & Safety Stock
            </h2>
            <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                <input 
                    type="text" 
                    placeholder="Search Item..." 
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
                        <th className="px-6 py-4 text-center">Current Stock</th>
                        <th className="px-6 py-4 text-center">Reorder Level</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin inline mr-2"/> Loading...</td></tr>
                    ) : filteredItems.length === 0 ? (
                        <tr><td colSpan={5} className="py-8 text-center text-slate-500">No items found.</td></tr>
                    ) : (
                        filteredItems.map(item => {
                            const isEditing = editingId === item.id;
                            const isLow = item.stock <= item.reorderLevel;
                            
                            return (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-900">{item.name}</p>
                                        <p className="text-xs text-slate-500">{item.sku}</p>
                                    </td>
                                    
                                    <td className="px-6 py-4 text-center font-medium">
                                        {item.stock} {item.uom}
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        {isEditing ? (
                                            <input 
                                                type="number" className="w-20 border border-blue-300 rounded px-2 py-1 text-center"
                                                value={editLevel}
                                                onChange={e => setEditLevel(Number(e.target.value))}
                                            />
                                        ) : (
                                            <span className="text-slate-600">{item.reorderLevel}</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                            isLow ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'
                                        }`}>
                                            {isLow ? <AlertTriangle size={12}/> : <CheckCircle size={12}/>}
                                            {isLow ? (item.stock === 0 ? 'Out of Stock' : 'Low Stock') : 'Healthy'}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        {isEditing ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleSave(item.id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={16}/></button>
                                                <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline text-sm">Update Level</button>
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

export default ReorderLevelView;
