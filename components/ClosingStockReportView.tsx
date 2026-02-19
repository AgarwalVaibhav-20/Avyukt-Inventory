import React, { useState, useEffect } from 'react';
import { stockControlService } from '../services/stockControlService';
import { ClosingStockSnapshot } from '../types';
import { Calendar, FileText, Loader2, Download } from 'lucide-react';

const ClosingStockReportView: React.FC = () => {
  const [history, setHistory] = useState<ClosingStockSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await stockControlService.getClosingStockHistory();
    setHistory(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="text-indigo-600" size={20}/> Closing Stock Reports
                </h2>
                <button className="flex items-center gap-2 text-slate-600 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium">
                    <Download size={16}/> Export All
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Report Date</th>
                            <th className="px-6 py-4">Total Inventory Value</th>
                            <th className="px-6 py-4 text-center">Total SKUs</th>
                            <th className="px-6 py-4 text-center">Valuation Method</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> : 
                         history.map(row => (
                            <tr key={row.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-400"/>
                                    {row.date}
                                </td>
                                <td className="px-6 py-4 font-bold text-green-700">${row.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                <td className="px-6 py-4 text-center">{row.itemCount}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">{row.method}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-blue-600 hover:underline text-xs font-medium">View Details</button>
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

export default ClosingStockReportView;
