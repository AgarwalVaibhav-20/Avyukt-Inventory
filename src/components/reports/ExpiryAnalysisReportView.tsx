import React, { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { exportService } from '@/services/exportService';
import ExportDialog, { ExportPeriod, ExportFormat } from '@/components/common/ExportDialog';
import { Batch } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarX, Loader2, AlertTriangle, Clock, CheckCircle, Download } from 'lucide-react';

const ExpiryAnalysisReportView: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await reportService.getExpiryReport();
    setBatches(data);
    
    // Calculate statistics
    const today = new Date();
    const expired = data.filter(b => new Date(b.expiryDate) < today).length;
    const expiringSoon = data.filter(b => {
      const daysLeft = Math.ceil((new Date(b.expiryDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
      return daysLeft > 0 && daysLeft <= 30;
    }).length;
    const safe = data.filter(b => {
      const daysLeft = Math.ceil((new Date(b.expiryDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
      return daysLeft > 30;
    }).length;

    const expiredQty = data
      .filter(b => new Date(b.expiryDate) < today)
      .reduce((sum, b) => sum + b.quantity, 0);
    const expiringSoonQty = data
      .filter(b => {
        const daysLeft = Math.ceil((new Date(b.expiryDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
        return daysLeft > 0 && daysLeft <= 30;
      })
      .reduce((sum, b) => sum + b.quantity, 0);

    setStats({
      total: data.length,
      expired,
      expiringSoon,
      safe,
      expiredQty,
      expiringSoonQty
    });

    // Chart data for expiry range
    const ranges = [
      { range: 'Already Expired', count: expired, qty: expiredQty },
      { range: 'Expiring Soon (0-30d)', count: expiringSoon, qty: expiringSoonQty },
      { range: 'Safe (>30d)', count: safe, qty: data.filter(b => {
        const daysLeft = Math.ceil((new Date(b.expiryDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
        return daysLeft > 30;
      }).reduce((sum, b) => sum + b.quantity, 0) }
    ];

    setChartData(ranges);
    setLoading(false);
  };

  const handleExport = async (period: ExportPeriod, format: ExportFormat) => {
    await exportService.exportExpiryAnalysis(period, format);
  };

  if (loading) return (
    <div className="flex h-screen justify-center items-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
        <p className="text-slate-600 font-medium">Loading expiry analysis...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Expiry Analysis Report</h1>
          <p className="text-slate-600">Monitor batch expiry dates and manage stock lifecycle</p>
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
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Total Batches</p>
              <p className="text-4xl font-bold text-blue-900 mt-3">{stats.total}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-blue-600 shadow-md group-hover:shadow-lg transition-shadow">
              <Clock size={28} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-red-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-red-600">Already Expired</p>
              <p className="text-4xl font-bold text-red-900 mt-3">{stats.expired}</p>
              <span className="text-red-600 text-xs font-semibold flex items-center mt-2"><AlertTriangle size={14} className="mr-1" /> {stats.expiredQty} units</span>
            </div>
            <div className="rounded-xl bg-white p-3 text-red-600 shadow-md group-hover:shadow-lg transition-shadow">
              <CalendarX size={28} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-orange-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">Expiring Soon (0-30d)</p>
              <p className="text-4xl font-bold text-orange-900 mt-3">{stats.expiringSoon}</p>
              <span className="text-orange-600 text-xs font-semibold flex items-center mt-2"><AlertTriangle size={14} className="mr-1" /> {stats.expiringSoonQty} units</span>
            </div>
            <div className="rounded-xl bg-white p-3 text-orange-600 shadow-md group-hover:shadow-lg transition-shadow">
              <Clock size={28} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Safe (&gt;30d)</p>
              <p className="text-4xl font-bold text-emerald-900 mt-3">{stats.safe}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-emerald-600 shadow-md group-hover:shadow-lg transition-shadow">
              <CheckCircle size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Expiry Status Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-gradient-to-br from-red-500 to-red-600 p-2.5 text-white">
            <CalendarX size={20} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Batch Expiry Status Overview</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} formatter={(value: any, name: string) => name === 'qty' ? `${value} units` : `${value} batches`} />
              <Bar dataKey="count" fill="#ef4444" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-white p-8 border-b border-slate-200">
          <h3 className="text-2xl font-bold text-slate-900">Batch Expiry Details</h3>
          <p className="text-sm text-slate-600 mt-1">Sorted by expiry date (most critical first)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-700">Batch Number</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Item Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Stock Qty</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Expiry Date</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-700">Days to Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((b, index) => {
                const daysLeft = Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                let badgeColor = '';
                let badgeClass = '';
                if (daysLeft < 0) {
                  badgeColor = 'bg-red-100 text-red-700';
                  badgeClass = 'border-l-4 border-red-500';
                } else if (daysLeft < 30) {
                  badgeColor = 'bg-orange-100 text-orange-700';
                  badgeClass = 'border-l-4 border-orange-500';
                } else {
                  badgeColor = 'bg-emerald-100 text-emerald-700';
                  badgeClass = 'border-l-4 border-emerald-500';
                }

                return (
                  <tr key={b.id} className={`transition-colors hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${badgeClass}`}>
                    <td className="px-6 py-4 font-mono text-slate-700 font-semibold">{b.batchNumber}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{b.itemName}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{b.quantity}</td>
                    <td className="px-6 py-4 text-slate-600">{b.expiryDate}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold ${badgeColor}`}>
                        {daysLeft < 0 ? '⚠️ EXPIRED' : `${daysLeft} Days`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        reportName="Expiry Analysis Report"
      />
    </div>
  );
};

export default ExpiryAnalysisReportView;
