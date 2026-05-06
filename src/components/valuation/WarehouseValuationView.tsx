import React, { useState, useEffect } from 'react';
import { stockControlService } from '@/services/stockControlService';
import { Warehouse, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const WarehouseValuationView: React.FC = () => {
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await stockControlService.getWarehouseValuation();
    setReport(data);
    setLoading(false);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Warehouse className="text-blue-600" size={20}/> Warehouse Valuation Report
                </h2>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Warehouse</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4 text-center">SKUs Held</th>
                                <th className="px-6 py-4 text-right">Total Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? <tr><td colSpan={4} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> : 
                             report.map(w => (
                                <tr key={w.warehouseId} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-bold text-slate-800">{w.warehouseName}</td>
                                    <td className="px-6 py-4 text-slate-600">{w.location}</td>
                                    <td className="px-6 py-4 text-center">{w.itemCount}</td>
                                    <td className="px-6 py-4 text-right font-medium text-green-700">${w.valuation.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center">
                <h3 className="font-semibold text-slate-700 mb-4 self-start">Value Distribution</h3>
                <div className="w-full h-64">
                    {loading ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-slate-400"/></div> :
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={report}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="valuation"
                                nameKey="warehouseName"
                            >
                                {report.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val: number) => `$${val.toLocaleString()}`} />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                     </ResponsiveContainer>
                    }
                </div>
            </div>
        </div>
    </div>
  );
};

export default WarehouseValuationView;
