import React, { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { BarChart3, Package, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';

const StockSummaryReportView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await reportService.getStockSummary();
    setStats(data);
    setLoading(false);
  };

  if (loading) return <div className="flex h-64 justify-center items-center"><Loader2 className="animate-spin text-slate-400"/></div>;

  return (
    <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800">Inventory Stock Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Package size={24}/></div>
                </div>
                <p className="text-slate-500 text-sm font-medium">Total Items</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalItems}</h3>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600"><BarChart3 size={24}/></div>
                </div>
                <p className="text-slate-500 text-sm font-medium">Total Quantity</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.totalStock.toLocaleString()}</h3>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-green-50 rounded-lg text-green-600"><DollarSign size={24}/></div>
                </div>
                <p className="text-slate-500 text-sm font-medium">Total Value</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">${stats.totalValue.toLocaleString()}</h3>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-red-50 rounded-lg text-red-600"><AlertTriangle size={24}/></div>
                </div>
                <p className="text-slate-500 text-sm font-medium">Low Stock Items</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{stats.lowStock}</h3>
            </div>
        </div>
        
        {/* Placeholder for charts */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
            <BarChart3 className="mx-auto text-slate-300 mb-4" size={48}/>
            <p className="text-slate-500">Additional graphical breakdowns available in future updates.</p>
        </div>
    </div>
  );
};

export default StockSummaryReportView;
