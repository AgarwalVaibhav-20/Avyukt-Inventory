import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { InventoryItem } from '../types';
import { Search, Download, Loader2 } from 'lucide-react';

const ItemStockReportView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await reportService.getItemStockReport();
    setItems(data);
    setLoading(false);
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800">Item-wise Stock Report</h2>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                        <input type="text" placeholder="Filter Items..." className="pl-9 pr-4 py-2 border rounded-lg text-sm" value={search} onChange={e => setSearch(e.target.value)}/>
                    </div>
                    <button className="flex items-center gap-2 border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium">
                        <Download size={16}/> Export
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4 text-right">Stock</th>
                            <th className="px-6 py-4 text-right">Reorder Level</th>
                            <th className="px-6 py-4 text-right">Unit Value</th>
                            <th className="px-6 py-4 text-right">Total Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> : 
                         filtered.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800">{item.name}</p>
                                    <p className="text-xs text-slate-500">{item.sku}</p>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{item.category}</td>
                                <td className="px-6 py-4 text-right font-medium">{item.stock} {item.uom}</td>
                                <td className="px-6 py-4 text-right text-slate-500">{item.reorderLevel}</td>
                                <td className="px-6 py-4 text-right">${item.unitPrice.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right font-bold text-blue-700">${(item.stock * item.unitPrice).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default ItemStockReportView;
