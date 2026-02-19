import React, { useState, useEffect } from 'react';
import { documentService } from '../services/documentService';
import { InspectionReport } from '../types';
import { FileCheck, Search, Loader2 } from 'lucide-react';

const InspectionReportsDocView: React.FC = () => {
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await documentService.getInspectionReports();
    setReports(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileCheck className="text-green-600" size={20}/> Inspection Reports
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                    <input type="text" placeholder="Search Report..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64"/>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Report #</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Reference</th>
                            <th className="px-6 py-4">Inspector</th>
                            <th className="px-6 py-4">Result</th>
                            <th className="px-6 py-4">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> :
                         reports.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-500">No reports found.</td></tr> :
                         reports.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-800">{r.reportNumber}</td>
                                <td className="px-6 py-4 text-slate-500">{r.date}</td>
                                <td className="px-6 py-4">{r.referenceType} - {r.referenceId}</td>
                                <td className="px-6 py-4 text-slate-600">{r.inspector}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${r.result === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {r.result}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{r.remarks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default InspectionReportsDocView;
