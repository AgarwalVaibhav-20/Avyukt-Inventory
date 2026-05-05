import React, { useState, useEffect } from 'react';
import { dashboardService } from '@/services/dashboardService';
import { WarehouseStockReport } from '@/types';
import { Warehouse, BarChart, Loader2 } from 'lucide-react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardWarehouse: React.FC = () => {
  const [report, setReport] = useState<WarehouseStockReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await dashboardService.getWarehouseStockReport();
    setReport(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Warehouse className="text-blue-600" size={20}/> Warehouse Stock Distribution
            </h2>

            {loading ? <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-slate-400"/></div> : 
             <>
                <div className="h-80 mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart data={report} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                            <XAxis dataKey="warehouseName" axisLine={false} tickLine={false} tick={{fill: '#64748b'}}/>
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}}/>
                            <Tooltip 
                                cursor={{fill: '#f1f5f9'}}
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            />
                            <Bar dataKey="totalValue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Stock Value ($)"/>
                        </ReBarChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {report.map(wh => (
                        <div key={wh.warehouseId} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                            <h3 className="font-bold text-slate-800 mb-1">{wh.warehouseName}</h3>
                            <div className="flex justify-between items-center text-sm text-slate-600 mt-3">
                                <span>Total Value</span>
                                <span className="font-bold text-slate-900">${wh.totalValue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-slate-600 mt-1">
                                <span>Item Count</span>
                                <span>{wh.totalItems} SKUs</span>
                            </div>
                            <div className="mt-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-500">Utilization</span>
                                    <span className={`font-bold ${wh.utilization > 80 ? 'text-red-600' : 'text-green-600'}`}>{wh.utilization}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                    <div 
                                        className={`h-1.5 rounded-full ${wh.utilization > 80 ? 'bg-red-500' : 'bg-green-500'}`} 
                                        style={{width: `${wh.utilization}%`}}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             </>
            }
        </div>
    </div>
  );
};

export default DashboardWarehouse;
