import React, { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { AgingAnalysisItem } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, Loader2, Package, AlertTriangle, TrendingUp } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const AGE_RANGES = ['0-30 Days', '31-60 Days', '61-90 Days', '>90 Days'];

const AgingAnalysisView: React.FC = () => {
  const [data, setData] = useState<AgingAnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

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

  if (loading) return <div className="flex h-64 justify-center items-center"><Loader2 className="animate-spin text-slate-400"/></div>;

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Stock</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalStock.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Package size={24}/></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Fresh Stock (0-30d)</p>
                        <h3 className="text-3xl font-bold text-green-600 mt-2">{stats.freshStock.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-green-600"><TrendingUp size={24}/></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Medium Age (31-90d)</p>
                        <h3 className="text-3xl font-bold text-blue-600 mt-2">{stats.mediumStock.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Clock size={24}/></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Old Stock (&gt;90d)</p>
                        <h3 className="text-3xl font-bold text-red-600 mt-2">{stats.oldStock.toLocaleString()}</h3>
                        <span className="text-red-500 text-xs font-medium flex items-center mt-1"><AlertTriangle size={12} className="mr-1" /> {stats.oldPercentage}% of total</span>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg text-red-600"><AlertTriangle size={24}/></div>
                </div>
            </div>
        </div>

        {/* Age Distribution Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Clock size={20} className="text-orange-600"/> Stock Age Distribution
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                            formatter={(value: any, name: string, props: any) => [`${value} units (${props.payload.percentage}%)`, 'Quantity']}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Item-wise Aging Analysis</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Item Name</th>
                            <th className="px-6 py-4 text-right">Total Stock</th>
                            <th className="px-6 py-4 text-right bg-green-50 text-green-700">0-30 Days</th>
                            <th className="px-6 py-4 text-right bg-blue-50 text-blue-700">31-60 Days</th>
                            <th className="px-6 py-4 text-right bg-orange-50 text-orange-700">61-90 Days</th>
                            <th className="px-6 py-4 text-right bg-red-50 text-red-700">&gt; 90 Days</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                         {data.map(item => {
                             const b30 = item.buckets.find(b => b.range === '0-30 Days')?.quantity || 0;
                             const b60 = item.buckets.find(b => b.range === '31-60 Days')?.quantity || 0;
                             const b90 = item.buckets.find(b => b.range === '61-90 Days')?.quantity || 0;
                             const b90plus = item.buckets.find(b => b.range === '>90 Days')?.quantity || 0;

                             return (
                                <tr key={item.itemId} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-800">{item.itemName}</td>
                                    <td className="px-6 py-4 text-right font-bold">{item.totalStock}</td>
                                    <td className="px-6 py-4 text-right bg-green-50/30 text-green-700 font-medium">{b30 || '-'}</td>
                                    <td className="px-6 py-4 text-right bg-blue-50/30 text-blue-700 font-medium">{b60 || '-'}</td>
                                    <td className="px-6 py-4 text-right bg-orange-50/30 text-orange-700 font-medium">{b90 || '-'}</td>
                                    <td className="px-6 py-4 text-right bg-red-50/30 text-red-700 font-bold">{b90plus || '-'}</td>
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

export default AgingAnalysisView;
