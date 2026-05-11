import React, { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { exportService } from '@/services/exportService';
import ExportDialog, { ExportPeriod, ExportFormat } from '@/components/common/ExportDialog';
import { AgingAnalysisItem } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, Loader2, Package, AlertTriangle, TrendingUp, Download } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const AGE_RANGES = ['0-30 Days', '31-60 Days', '61-90 Days', '>90 Days'];

const AgingAnalysisView: React.FC = () => {
  const [data, setData] = useState<AgingAnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await reportService.getAgingReport();
    setData(res);
    
    // Calculate statistics
    const totalStock = res.reduce((sum, item) => sum + item.totalStock, 0);
    const ageStats = AGE_RANGES.map((range) => {
      const qty = res.reduce((sum, item) => {
        const bucket = item.buckets.find(b => b.range === range);
        return sum + (bucket?.quantity || 0);
      }, 0);
      return { range, qty, percentage: ((qty / totalStock) * 100).toFixed(1) };
    });

    setStats({
      totalStock,
      freshStock: ageStats[0].qty,
      mediumStock: ageStats[1].qty + ageStats[2].qty,
      oldStock: ageStats[3].qty,
      oldPercentage: ageStats[3].percentage
    });

    // Chart data
    const chart = AGE_RANGES.map((range) => {
      const qty = res.reduce((sum, item) => {
        const bucket = item.buckets.find(b => b.range === range);
        return sum + (bucket?.quantity || 0);
      }, 0);
      return { name: range, value: qty, percentage: ((qty / totalStock) * 100).toFixed(1) };
    });
    setChartData(chart);
    
    setLoading(false);
  };

  const handleExport = async (period: ExportPeriod, format: ExportFormat) => {
    await exportService.exportAgingAnalysis(period, format);
  };

  if (loading) return (
    <div className="flex h-screen justify-center items-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
        <p className="text-slate-600 font-medium">Loading aging analysis...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Stock Aging Analysis</h1>
          <p className="text-slate-600">Analyze inventory age and optimize stock rotation</p>
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
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Total Stock</p>
              <p className="text-4xl font-bold text-blue-900 mt-3">{stats.totalStock.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-blue-600 shadow-md group-hover:shadow-lg transition-shadow">
              <Package size={28} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Fresh Stock (0-30d)</p>
              <p className="text-4xl font-bold text-emerald-900 mt-3">{stats.freshStock.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-emerald-600 shadow-md group-hover:shadow-lg transition-shadow">
              <TrendingUp size={28} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600">Medium Age (31-90d)</p>
              <p className="text-4xl font-bold text-cyan-900 mt-3">{stats.mediumStock.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-cyan-600 shadow-md group-hover:shadow-lg transition-shadow">
              <Clock size={28} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-red-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-red-600">Old Stock (&gt;90d)</p>
              <p className="text-4xl font-bold text-red-900 mt-3">{stats.oldStock.toLocaleString()}</p>
              <span className="text-red-600 text-xs font-semibold flex items-center mt-2"><AlertTriangle size={14} className="mr-1" /> {stats.oldPercentage}% of total</span>
            </div>
            <div className="rounded-xl bg-white p-3 text-red-600 shadow-md group-hover:shadow-lg transition-shadow">
              <AlertTriangle size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Age Distribution Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 text-white">
            <Clock size={20} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Stock Age Distribution</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} formatter={(value: any, name: string, props: any) => [`${value} units (${props.payload.percentage}%)`, 'Quantity']} />
              <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-white p-8 border-b border-slate-200">
          <h3 className="text-2xl font-bold text-slate-900">Item-wise Aging Analysis</h3>
          <p className="text-sm text-slate-600 mt-1">Stock distribution by age range</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-700">Item Name</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-700">Total Stock</th>
                <th className="px-6 py-4 text-right font-semibold text-emerald-700 bg-emerald-50">0-30 Days</th>
                <th className="px-6 py-4 text-right font-semibold text-blue-700 bg-blue-50">31-60 Days</th>
                <th className="px-6 py-4 text-right font-semibold text-orange-700 bg-orange-50">61-90 Days</th>
                <th className="px-6 py-4 text-right font-semibold text-red-700 bg-red-50">&gt; 90 Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item, index) => {
                const b30 = item.buckets.find((b) => b.range === '0-30 Days')?.quantity || 0;
                const b60 = item.buckets.find((b) => b.range === '31-60 Days')?.quantity || 0;
                const b90 = item.buckets.find((b) => b.range === '61-90 Days')?.quantity || 0;
                const b90plus = item.buckets.find((b) => b.range === '>90 Days')?.quantity || 0;

                return (
                  <tr key={item.itemId} className={`transition-colors hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <td className="px-6 py-4 font-semibold text-slate-900">{item.itemName}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">{item.totalStock}</td>
                    <td className="px-6 py-4 text-right bg-emerald-50 text-emerald-700 font-semibold">{b30 || '-'}</td>
                    <td className="px-6 py-4 text-right bg-blue-50 text-blue-700 font-semibold">{b60 || '-'}</td>
                    <td className="px-6 py-4 text-right bg-orange-50 text-orange-700 font-semibold">{b90 || '-'}</td>
                    <td className="px-6 py-4 text-right bg-red-50 text-red-700 font-bold">{b90plus || '-'}</td>
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
        reportName="Stock Aging Analysis"
      />
    </div>
  );
};

export default AgingAnalysisView;
