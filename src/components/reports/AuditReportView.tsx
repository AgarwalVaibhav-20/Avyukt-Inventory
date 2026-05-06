import React, { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { AuditLog } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, Search, Loader2, Activity } from 'lucide-react';

const AuditReportView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await reportService.getAuditLogs();
    setLogs(data);
    
    // Calculate statistics
    const creates = data.filter(l => l.action === 'Create').length;
    const updates = data.filter(l => l.action === 'Update').length;
    const deletes = data.filter(l => l.action === 'Delete').length;
    const uniqueUsers = new Set(data.map(l => l.user)).size;

    setStats({
      totalLogs: data.length,
      creates,
      updates,
      deletes,
      uniqueUsers
    });

    // Action distribution chart
    const chart = [
      { action: 'Create', count: creates },
      { action: 'Update', count: updates },
      { action: 'Delete', count: deletes }
    ];

    setChartData(chart);
    setLoading(false);
  };

  const filtered = logs.filter(l => 
      l.user.toLowerCase().includes(search.toLowerCase()) || 
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.module.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex h-64 justify-center items-center"><Loader2 className="animate-spin text-slate-400"/></div>;

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Logs</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalLogs}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Activity size={24}/></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Creates</p>
                        <h3 className="text-3xl font-bold text-green-600 mt-2">{stats.creates}</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-green-600">
                        <span className="text-xs font-bold">+</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Updates</p>
                        <h3 className="text-3xl font-bold text-blue-600 mt-2">{stats.updates}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                        <span className="text-xs font-bold">↻</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Unique Users</p>
                        <h3 className="text-3xl font-bold text-purple-600 mt-2">{stats.uniqueUsers}</h3>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                        <span className="text-xs font-bold">👥</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Action Distribution Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Shield size={20} className="text-slate-600"/> Audit Activity Distribution
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="action" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="count" fill="#64748b" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <Shield className="text-slate-600" size={20}/> System Audit Logs
                </h3>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                    <input 
                        type="text" 
                        placeholder="Search Logs..." 
                        className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                    />
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
                         {filtered.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-slate-600 font-mono text-xs">{log.date} {log.timestamp}</td>
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
                                <td className="px-6 py-4 text-slate-700 font-medium">{log.module}</td>
                                <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{log.description}</td>
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
