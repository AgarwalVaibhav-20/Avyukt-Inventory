import React, { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { AuditLog } from '@/types';
import { Shield, Search, Loader2 } from 'lucide-react';

const AuditReportView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await reportService.getAuditLogs();
    setLogs(data);
    setLoading(false);
  };

  const filtered = logs.filter(l => 
      l.user.toLowerCase().includes(search.toLowerCase()) || 
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.module.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="text-slate-600" size={20}/> System Audit Logs
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                    <input type="text" placeholder="Search Logs..." className="pl-9 pr-4 py-2 border rounded-lg text-sm" value={search} onChange={e => setSearch(e.target.value)}/>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Module</th>
                            <th className="px-6 py-4">Description</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> : 
                         filtered.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{log.date} {log.timestamp}</td>
                                <td className="px-6 py-4 font-medium text-slate-800">{log.user}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        log.action === 'Delete' ? 'bg-red-100 text-red-700' : 
                                        log.action === 'Create' ? 'bg-green-100 text-green-700' : 
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{log.module}</td>
                                <td className="px-6 py-4 text-slate-500">{log.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default AuditReportView;
