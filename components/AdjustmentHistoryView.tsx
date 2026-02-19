import React, { useState, useEffect } from 'react';
import { movementService } from '../services/movementService';
import { StockAdjustment } from '../types';
import { History, Search, Loader2, ArrowUp, ArrowDown } from 'lucide-react';

const AdjustmentHistoryView: React.FC = () => {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await movementService.getAdjustments();
    // Sort by date descending
    setAdjustments(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setLoading(false);
  };

  const filtered = adjustments.filter(a => 
      a.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <History className="text-slate-600" size={20}/> Adjustment History Log
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Reference</th>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4">Reason / Type</th>
                            <th className="px-6 py-4 text-right">Adjustment</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> :
                         filtered.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-500">No logs found.</td></tr> :
                         filtered.map(adj => (
                            <tr key={adj.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-slate-500">{adj.date}</td>
                                <td className="px-6 py-4 font-mono text-slate-700">{adj.reference}</td>
                                <td className="px-6 py-4 font-medium">{adj.itemName}</td>
                                <td className="px-6 py-4">
                                    <span className="block text-slate-800">{adj.reason}</span>
                                    <span className="text-xs text-slate-500">{adj.type}</span>
                                </td>
                                <td className="px-6 py-4 text-right font-bold">
                                    <div className={`flex items-center justify-end gap-1 ${adj.impact === 'Add' ? 'text-green-600' : 'text-red-600'}`}>
                                        {adj.impact === 'Add' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>}
                                        {adj.quantity}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">{adj.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default AdjustmentHistoryView;
