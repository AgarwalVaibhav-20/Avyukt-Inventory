import React, { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { Batch } from '@/types';
import { CalendarX, Loader2 } from 'lucide-react';

const ExpiryAnalysisReportView: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await reportService.getExpiryReport();
    setBatches(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <CalendarX className="text-red-600" size={20}/> Batch Expiry Report
            </h2>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Batch Number</th>
                            <th className="px-6 py-4">Item Name</th>
                            <th className="px-6 py-4">Stock Qty</th>
                            <th className="px-6 py-4">Expiry Date</th>
                            <th className="px-6 py-4 text-center">Days to Expiry</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> : 
                         batches.map(b => {
                             const daysLeft = Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                             return (
                                <tr key={b.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-slate-700">{b.batchNumber}</td>
                                    <td className="px-6 py-4">{b.itemName}</td>
                                    <td className="px-6 py-4 font-medium">{b.quantity}</td>
                                    <td className="px-6 py-4">{b.expiryDate}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${daysLeft < 0 ? 'bg-red-100 text-red-700' : daysLeft < 30 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                            {daysLeft < 0 ? 'EXPIRED' : `${daysLeft} Days`}
                                        </span>
                                    </td>
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

export default ExpiryAnalysisReportView;
