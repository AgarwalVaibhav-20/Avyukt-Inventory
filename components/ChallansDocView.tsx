import React, { useState, useEffect } from 'react';
import { salesService } from '../services/salesService';
import { DeliveryChallan } from '../types';
import { FileText, Printer, Loader2 } from 'lucide-react';

const ChallansDocView: React.FC = () => {
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await salesService.getChallans();
    setChallans(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="text-indigo-600" size={20}/> Delivery Challans
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Challan #</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">SO Reference</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> :
                         challans.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-500">No challans found.</td></tr> :
                         challans.map(dc => (
                            <tr key={dc.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-800">{dc.challanNumber}</td>
                                <td className="px-6 py-4 text-slate-500">{dc.date}</td>
                                <td className="px-6 py-4">{dc.customerName}</td>
                                <td className="px-6 py-4 text-slate-500">{dc.soNumber}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                                        {dc.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => alert("Printing DC...")} className="text-slate-400 hover:text-indigo-600">
                                        <Printer size={18}/>
                                    </button>
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

export default ChallansDocView;
