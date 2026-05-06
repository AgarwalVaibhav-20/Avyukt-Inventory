import React, { useState, useEffect } from 'react';
import { stockControlService } from '@/services/stockControlService';
import { BarChart3, PieChart, TrendingUp, Loader2 } from 'lucide-react';

const ValuationAnalysisView: React.FC = () => {
  const [report, setReport] = useState<any[]>([]);
  const [method, setMethod] = useState<'FIFO' | 'LIFO' | 'Avg'>('FIFO');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [method]);

  const loadReport = async () => {
    setLoading(true);
    const data = await stockControlService.getValuationReport(method);
    setReport(data);
    setLoading(false);
  };

  const totalValuation = report.reduce((sum, item) => sum + item.totalValuation, 0);

  return (
    <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="text-blue-600" size={20}/> Inventory Valuation
                </h2>
                <p className="text-sm text-slate-500">Calculate closing stock value based on selected method.</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg">
                {(['FIFO', 'LIFO', 'Avg'] as const).map(m => (
                    <button 
                        key={m}
                        onClick={() => setMethod(m)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${method === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {m === 'Avg' ? 'Weighted Avg' : m}
                    </button>
                ))}
            </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg flex justify-between items-center">
            <div>
                <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Total Inventory Value ({method})</p>
                <h3 className="text-3xl font-bold mt-1">${totalValuation.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
            </div>
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <TrendingUp size={32} className="text-white"/>
            </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
                <h3 className="font-semibold text-slate-800">Item-wise Valuation Report</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">SKU</th>
                            <th className="px-6 py-4">Item Name</th>
                            <th className="px-6 py-4 text-right">Stock Qty</th>
                            <th className="px-6 py-4 text-right">Unit Value ({method})</th>
                            <th className="px-6 py-4 text-right">Total Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin inline mr-2"/> Calculating...</td></tr> :
                         report.map(item => (
                            <tr key={item.itemId} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-mono text-slate-500">{item.sku}</td>
                                <td className="px-6 py-4 font-medium text-slate-800">{item.itemName}</td>
                                <td className="px-6 py-4 text-right">{item.stock}</td>
                                <td className="px-6 py-4 text-right">${item.unitValuation.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right font-bold text-blue-700">${item.totalValuation.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default ValuationAnalysisView;
