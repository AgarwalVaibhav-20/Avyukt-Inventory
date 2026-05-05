import React, { useState, useEffect } from 'react';
import { dashboardService } from '@/services/dashboardService';
import { InOutSummary } from '@/types';
import { ArrowDownToLine, ArrowUpFromLine, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DashboardInOut: React.FC = () => {
  const [summary, setSummary] = useState<InOutSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await dashboardService.getInOutSummary();
    setSummary(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <ArrowDownToLine className="text-blue-600" size={20}/> Inward vs Outward Trends
            </h2>

            {loading ? <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-slate-400"/></div> :
             <>
                <div className="h-80 mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={summary} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                            <defs>
                                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="period" />
                            <YAxis />
                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                            <Tooltip contentStyle={{ borderRadius: '8px' }}/>
                            <Legend />
                            <Area type="monotone" dataKey="inwardValue" stroke="#22c55e" fillOpacity={1} fill="url(#colorIn)" name="Inward Value ($)" />
                            <Area type="monotone" dataKey="outwardValue" stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" name="Outward Value ($)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Period</th>
                                <th className="px-6 py-4 text-right text-green-700">Inward Qty</th>
                                <th className="px-6 py-4 text-right text-green-700">Inward Value</th>
                                <th className="px-6 py-4 text-right text-red-700">Outward Qty</th>
                                <th className="px-6 py-4 text-right text-red-700">Outward Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {summary.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-bold text-slate-700">{row.period}</td>
                                    <td className="px-6 py-4 text-right">{row.inwardQty}</td>
                                    <td className="px-6 py-4 text-right text-green-600 font-medium">${row.inwardValue.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right">{row.outwardQty}</td>
                                    <td className="px-6 py-4 text-right text-red-600 font-medium">${row.outwardValue.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </>
            }
        </div>
    </div>
  );
};

export default DashboardInOut;
