import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import { MovementAnalysis } from '../types';
import { Activity, TrendingUp, TrendingDown, MinusCircle, Loader2 } from 'lucide-react';

const DashboardMovement: React.FC = () => {
  const [data, setData] = useState<MovementAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Fast' | 'Slow' | 'Non'>('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await dashboardService.getMovementAnalysis();
    setData(res);
    setLoading(false);
  };

  const filtered = data.filter(d => 
      filter === 'All' || 
      (filter === 'Fast' && d.classification === 'Fast Moving') ||
      (filter === 'Slow' && d.classification === 'Slow Moving') ||
      (filter === 'Non' && d.classification === 'Non-Moving')
  );

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="text-indigo-600" size={20}/> Movement Analysis
                    </h2>
                    <p className="text-sm text-slate-500">Based on outgoing transactions over the last 30 days.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setFilter('All')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'All' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>All</button>
                    <button onClick={() => setFilter('Fast')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'Fast' ? 'bg-white shadow text-green-600' : 'text-slate-500'}`}>Fast</button>
                    <button onClick={() => setFilter('Slow')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'Slow' ? 'bg-white shadow text-amber-600' : 'text-slate-500'}`}>Slow</button>
                    <button onClick={() => setFilter('Non')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === 'Non' ? 'bg-white shadow text-red-600' : 'text-slate-500'}`}>Non-Moving</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Item Details</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Last Moved</th>
                            <th className="px-6 py-4 text-center">30-Day Outflow</th>
                            <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin inline"/> Analyzing...</td></tr> : 
                         filtered.map(item => (
                            <tr key={item.itemId} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800">{item.itemName}</p>
                                    <p className="text-xs text-slate-500">{item.sku}</p>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{item.category}</td>
                                <td className="px-6 py-4 text-slate-500">{item.lastMovementDate}</td>
                                <td className="px-6 py-4 text-center font-mono">{item.turnoverRate}</td>
                                <td className="px-6 py-4 text-right">
                                    {item.classification === 'Fast Moving' && (
                                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-bold">
                                            <TrendingUp size={12}/> Fast
                                        </span>
                                    )}
                                    {item.classification === 'Slow Moving' && (
                                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs font-bold">
                                            <TrendingDown size={12}/> Slow
                                        </span>
                                    )}
                                    {item.classification === 'Non-Moving' && (
                                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded text-xs font-bold">
                                            <MinusCircle size={12}/> Static
                                        </span>
                                    )}
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

export default DashboardMovement;
