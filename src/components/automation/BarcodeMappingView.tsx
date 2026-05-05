import React, { useState, useEffect } from 'react';
import { productService } from '@/services/productService';
import { InventoryItem } from '@/types';
import { QrCode, Save, Search, RefreshCw, Loader2 } from 'lucide-react';

const BarcodeMappingView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBarcode, setEditBarcode] = useState('');

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
    setEditBarcode(item.barcode || '');
  };

  const handleSave = async (id: string) => {
    await productService.updateBarcode(id, editBarcode);
    setEditingId(null);
    loadData();
  };

  const generateBarcode = () => {
    // Generate a mock EAN-13 style barcode
    const prefix = '890';
    const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    setEditBarcode(prefix + random);
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.sku.toLowerCase().includes(search.toLowerCase()) ||
    (i.barcode && i.barcode.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <QrCode className="text-purple-600" size={20}/> Barcode / QR Mapping
            </h2>
            <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                <input 
                    type="text" 
                    placeholder="Search SKU, Name, or Barcode..." 
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
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Assigned Barcode</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan={4} className="py-8 text-center"><Loader2 className="animate-spin inline mr-2"/> Loading...</td></tr>
                    ) : filteredItems.length === 0 ? (
                        <tr><td colSpan={4} className="py-8 text-center text-slate-500">No items found.</td></tr>
                    ) : (
                        filteredItems.map(item => {
                            const isEditing = editingId === item.id;
                            
                            return (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-900">{item.name}</p>
                                        <p className="text-xs text-slate-500">{item.sku}</p>
                                    </td>
                                    
                                    <td className="px-6 py-4 text-slate-600">
                                        {item.category}
                                    </td>

                                    <td className="px-6 py-4">
                                        {isEditing ? (
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" className="w-48 border border-purple-300 rounded px-2 py-1 font-mono text-sm"
                                                    value={editBarcode}
                                                    onChange={e => setEditBarcode(e.target.value)}
                                                    placeholder="Scan or Enter"
                                                    autoFocus
                                                />
                                                <button onClick={generateBarcode} title="Generate Random" className="text-slate-400 hover:text-purple-600">
                                                    <RefreshCw size={16}/>
                                                </button>
                                            </div>
                                        ) : (
                                            item.barcode ? (
                                                <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 tracking-wider">
                                                    {item.barcode}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic text-xs">Not Assigned</span>
                                            )
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        {isEditing ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleSave(item.id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={16}/></button>
                                                <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleEdit(item)} className="text-purple-600 hover:underline text-sm">
                                                {item.barcode ? 'Edit' : 'Assign'}
                                            </button>
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

export default BarcodeMappingView;
