import React, { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { exportService } from '@/services/exportService';
import ExportDialog, { ExportPeriod, ExportFormat } from '@/components/common/ExportDialog';
import { AuditLog } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, Search, Loader2, Activity, Download } from 'lucide-react';

const AuditReportView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);

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

  const handleExport = async (period: ExportPeriod, format: ExportFormat) => {
    await exportService.exportAudit(period, format);
  };

  const filtered = logs.filter(l => 
      l.user.toLowerCase().includes(search.toLowerCase()) || 
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.module.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-screen justify-center items-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
        <p className="text-slate-600 font-medium">Loading audit logs...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">System Audit Report</h1>
          <p className="text-slate-600">Track all system activities and user actions for compliance</p>
        </div>
        <button
          onClick={() => setShowExportDialog(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
        >
          <Download size={20} />
          Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Total Logs</p>
              <p className="text-4xl font-bold text-blue-900 mt-3">{stats.totalLogs}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-blue-600 shadow-md group-hover:shadow-lg transition-shadow">
              <Activity size={28} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Creates</p>
              <p className="text-4xl font-bold text-emerald-900 mt-3">{stats.creates}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-emerald-600 shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-xl font-bold">+</span>
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600">Updates</p>
              <p className="text-4xl font-bold text-cyan-900 mt-3">{stats.updates}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-cyan-600 shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-xl font-bold">↻</span>
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-600">Unique Users</p>
              <p className="text-4xl font-bold text-purple-900 mt-3">{stats.uniqueUsers}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-purple-600 shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-xl font-bold">👥</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Distribution Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 p-2.5 text-white">
            <Shield size={20} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Audit Activity Distribution</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="action" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" fill="#475569" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-white p-8 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Shield className="text-slate-700" size={24} /> System Audit Logs
              </h3>
              <p className="text-sm text-slate-600 mt-1">Detailed activity log of all system operations</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search logs..."
                className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-700">Timestamp</th>
                <th className="px-6 py-4 font-semibold text-slate-700">User</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Action</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Module</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log, index) => (
                <tr key={log.id} className={`transition-colors hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className="px-6 py-4 text-slate-600 font-mono text-xs">{log.date} {log.timestamp}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{log.user}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold ${
                        log.action === 'Delete'
                          ? 'bg-red-100 text-red-700'
                          : log.action === 'Create'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-semibold">{log.module}</td>
                  <td className="px-6 py-4 text-slate-600 max-w-lg truncate">{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        reportName="System Audit Report"
      />
    </div>
  );
};

export default AuditReportView;
