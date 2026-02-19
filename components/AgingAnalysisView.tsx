import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import { AgingAnalysisItem } from '../types';
import { Clock, Loader2 } from 'lucide-react';

const AgingAnalysisView: React.FC = () => {
  const [data, setData] = useState<AgingAnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await reportService.getAgingReport();
    setData(res);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="text-orange-600" size={20}/> Stock Aging Analysis
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Item Name</th>
                            <th className="px-6 py-4 text-right">Total Stock</th>
                            <th className="px-6 py-4 text-right bg-green-50 text-green-700">0-30 Days</th>
                            <th className="px-6 py-4 text-right bg-blue-50 text-blue-700">31-60 Days</th>
                            <th className="px-6 py-4 text-right bg-orange-50 text-orange-700">61-90 Days</th>
                            <th className="px-6 py-4 text-right bg-red-50 text-red-700">&gt; 90 Days</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> :
                         data.map(item => {
                             const b30 = item.buckets.find(b => b.range === '0-30 Days')?.quantity || 0;
                             const b60 = item.buckets.find(b => b.range === '31-60 Days')?.quantity || 0;
                             const b90 = item.buckets.find(b => b.range === '61-90 Days')?.quantity || 0;
                             const b90plus = item.buckets.find(b => b.range === '>90 Days')?.quantity || 0;

                             return (
                                <tr key={item.itemId} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-800">{item.itemName}</td>
                                    <td className="px-6 py-4 text-right font-bold">{item.totalStock}</td>
                                    <td className="px-6 py-4 text-right bg-green-50/30 text-green-700">{b30 || '-'}</td>
                                    <td className="px-6 py-4 text-right bg-blue-50/30 text-blue-700">{b60 || '-'}</td>
                                    <td className="px-6 py-4 text-right bg-orange-50/30 text-orange-700">{b90 || '-'}</td>
                                    <td className="px-6 py-4 text-right bg-red-50/30 text-red-700 font-bold">{b90plus || '-'}</td>
                                </tr>
                             );
                         })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default AgingAnalysisView;
