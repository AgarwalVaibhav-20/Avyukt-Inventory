import React, { useState, useEffect } from 'react';
import { stockControlService } from '@/services/stockControlService';
import { TrendingUp, DollarSign, Activity, AlertCircle, Loader2 } from 'lucide-react';

const RealTimeValuationView: React.FC = () => {
  const [data, setData] = useState<{total: number, topItems: any[], lowItems: number} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const report = await stockControlService.getValuationReport();
        const total = report.reduce((sum, i) => sum + i.totalValuation, 0);
        const sorted = [...report].sort((a,b) => b.totalValuation - a.totalValuation).slice(0, 5);
        const low = report.filter(i => i.stock <= 10).length; // Mock low stock logic
        
        setData({ total, topItems: sorted, lowItems: low });
        setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-blue-500" size={32}/></div>;

  return (
    <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/20 rounded-xl"><DollarSign size={24}/></div>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">Live</span>
                </div>
                <p className="text-blue-100 text-sm font-medium">Total Inventory Value</p>
                <h3 className="text-3xl font-bold mt-1">${data?.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl"><TrendingUp size={24}/></div>
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Daily Value Change</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1 flex items-center gap-2">
                        + $1,240.50 <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">+1.2%</span>
                    </h3>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl"><AlertCircle size={24}/></div>
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Value at Risk (Low Stock)</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{data?.lowItems} SKUs</h3>
                </div>
            </div>
        </div>

        {/* Top Value Items */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Top 5 Items by Value</h3>
            <div className="space-y-4">
                {data?.topItems.map((item, idx) => (
                    <div key={item.itemId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-4">
                            <span className="text-slate-400 font-bold text-lg w-6">0{idx + 1}</span>
                            <div>
                                <p className="font-bold text-slate-800">{item.itemName}</p>
                                <p className="text-xs text-slate-500">Qty: {item.stock} | Unit: ${item.unitValuation.toFixed(2)}</p>
                            </div>
                        </div>
                        <span className="font-bold text-blue-700">${item.totalValuation.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default RealTimeValuationView;
