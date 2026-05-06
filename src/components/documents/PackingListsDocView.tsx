import React, { useState, useEffect } from 'react';
import { salesService } from '@/services/salesService';
import { PackList } from '@/types';
import { Box, Printer, Loader2 } from 'lucide-react';

const PackingListsDocView: React.FC = () => {
  const [lists, setLists] = useState<PackList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await salesService.getPackLists();
    setLists(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Box className="text-amber-600" size={20}/> Packing Lists
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Packing List #</th>
                            <th className="px-6 py-4">SO Reference</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Box Count</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> :
                         lists.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-500">No packing lists found.</td></tr> :
                         lists.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-800">{p.packNumber}</td>
                                <td className="px-6 py-4">{p.soNumber}</td>
                                <td className="px-6 py-4 text-slate-500">{p.date}</td>
                                <td className="px-6 py-4 font-bold">{p.boxCount}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-medium">{p.status}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => alert("Printing...")} className="text-slate-400 hover:text-amber-600">
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

export default PackingListsDocView;
