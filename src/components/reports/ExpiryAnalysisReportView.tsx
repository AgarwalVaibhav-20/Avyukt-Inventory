import React, { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { Batch } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarX, Loader2, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const ExpiryAnalysisReportView: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

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

  if (loading) return <div className="flex h-64 justify-center items-center"><Loader2 className="animate-spin text-slate-400"/></div>;

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Batches</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Clock size={24}/></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Already Expired</p>
                        <h3 className="text-3xl font-bold text-red-600 mt-2">{stats.expired}</h3>
                        <span className="text-red-500 text-xs font-medium flex items-center mt-1"><AlertTriangle size={12} className="mr-1" /> {stats.expiredQty} units</span>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg text-red-600"><CalendarX size={24}/></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Expiring Soon (0-30d)</p>
                        <h3 className="text-3xl font-bold text-orange-600 mt-2">{stats.expiringSoon}</h3>
                        <span className="text-orange-500 text-xs font-medium flex items-center mt-1"><AlertTriangle size={12} className="mr-1" /> {stats.expiringSoonQty} units</span>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg text-orange-600"><Clock size={24}/></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Safe (&gt;30d)</p>
                        <h3 className="text-3xl font-bold text-green-600 mt-2">{stats.safe}</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-green-600"><CheckCircle size={24}/></div>
                </div>
            </div>
        </div>

        {/* Expiry Status Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <CalendarX size={20} className="text-red-600"/> Batch Expiry Status Overview
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} width={80} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                            formatter={(value: any, name: string) => name === 'qty' ? `${value} units` : `${value} batches`}
                        />
                        <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Batch Expiry Details (Sorted by Expiry Date)</h3>
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
                         {batches.map(b => {
                             const daysLeft = Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                             let badgeColor = '';
                             if (daysLeft < 0) badgeColor = 'bg-red-100 text-red-700';
                             else if (daysLeft < 30) badgeColor = 'bg-orange-100 text-orange-700';
                             else badgeColor = 'bg-green-100 text-green-700';

                             return (
                                <tr key={b.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-slate-700">{b.batchNumber}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{b.itemName}</td>
                                    <td className="px-6 py-4 font-medium">{b.quantity}</td>
                                    <td className="px-6 py-4 text-slate-600">{b.expiryDate}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${badgeColor}`}>
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
