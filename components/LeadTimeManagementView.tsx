import React, { useState, useEffect } from 'react';
import { vendorService } from '../services/vendorService';
import { VendorItemMap } from '../types';
import { Clock, TrendingUp, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const LeadTimeManagementView: React.FC = () => {
  const [data, setData] = useState<VendorItemMap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await vendorService.getVendorItemMaps();
    setData(res);
    setLoading(false);
  };

  // Group data for chart: Average Lead Time per Vendor
  const vendorStats = data.reduce((acc, curr) => {
      if(!acc[curr.vendorName]) acc[curr.vendorName] = { count: 0, totalDays: 0 };
      acc[curr.vendorName].count++;
      acc[curr.vendorName].totalDays += curr.leadTimeDays;
      return acc;
  }, {} as Record<string, {count: number, totalDays: number}>);

  const chartData = Object.keys(vendorStats).map(v => ({
      name: v,
      avgLeadTime: Math.round(vendorStats[v].totalDays / vendorStats[v].count)
  }));

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Clock className="text-orange-600" size={20}/> Lead Time Analysis
            </h2>

            <div className="h-64 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true}/>
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}}/>
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avgLeadTime" name="Avg Lead Time (Days)" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20}/>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4">Vendor</th>
                            <th className="px-6 py-4 text-center">Lead Time (Days)</th>
                            <th className="px-6 py-4 text-right">Reliability Score (Est.)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={4} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> : 
                         data.sort((a,b) => a.leadTimeDays - b.leadTimeDays).map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-800">{item.itemName}</td>
                                <td className="px-6 py-4">{item.vendorName}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.leadTimeDays <= 3 ? 'bg-green-100 text-green-700' : item.leadTimeDays > 14 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {item.leadTimeDays} Days
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1 text-slate-600">
                                        <TrendingUp size={14}/> High
                                    </div>
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

export default LeadTimeManagementView;
