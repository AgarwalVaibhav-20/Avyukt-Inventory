import React, { useState, useEffect } from 'react';
import { warehouseService } from '@/services/warehouseService';
import { WarehouseCapacityStats } from '@/types';
import { BarChart3, PieChart, Info, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Pie } from 'recharts';

const WarehouseCapacityView: React.FC = () => {
  const [stats, setStats] = useState<WarehouseCapacityStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await warehouseService.getWarehouseCapacityStats();
    setStats(data);
    setLoading(false);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg"><BarChart3 className="text-blue-600" size={24}/></div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Warehouse Capacity Planning</h2>
                    <p className="text-sm text-slate-500">Utilization metrics across all facilities.</p>
                </div>
            </div>

            {loading ? <div className="py-12 text-center"><Loader2 className="animate-spin inline text-slate-400" size={32}/></div> :
             stats.length === 0 ? <p className="text-center py-12 text-slate-500">No warehouse data available.</p> :
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {stats.map(wh => (
                     <div key={wh.warehouseId} className="border border-slate-200 rounded-xl p-6 bg-slate-50/50">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="font-bold text-lg text-slate-800">{wh.warehouseName}</h3>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold ${wh.utilizationRate > 85 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                 {wh.utilizationRate}% Utilized
                             </span>
                         </div>

                         {/* Overall Progress */}
                         <div className="mb-6">
                             <div className="flex justify-between text-sm text-slate-600 mb-1">
                                 <span>Occupied Bins: {wh.occupiedBins}</span>
                                 <span>Total: {wh.totalBins}</span>
                             </div>
                             <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                 <div 
                                    className={`h-full rounded-full transition-all duration-500 ${wh.utilizationRate > 85 ? 'bg-red-500' : 'bg-blue-500'}`} 
                                    style={{width: `${wh.utilizationRate}%`}}
                                 ></div>
                             </div>
                         </div>

                         {/* Zone Breakdown Chart */}
                         <div className="h-64 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Zone-wise Volume Usage</h4>
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={wh.zoneStats} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false}/>
                                    <XAxis type="number" hide/>
                                    <YAxis dataKey="zoneName" type="category" width={100} tick={{fontSize: 10}}/>
                                    <Tooltip cursor={{fill: 'transparent'}}/>
                                    <Bar dataKey="capacity" fill="#e2e8f0" barSize={20} stackId="a" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="used" fill="#3b82f6" barSize={20} stackId="a" radius={[0, 0, 0, 0]} />
                                </BarChart>
                             </ResponsiveContainer>
                         </div>
                     </div>
                 ))}
             </div>
            }
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 items-start">
            <Info className="text-blue-600 shrink-0 mt-0.5" size={20}/>
            <div>
                <h4 className="font-bold text-blue-800 text-sm">Capacity Optimization Tip</h4>
                <p className="text-xs text-blue-700 mt-1">
                    Warehouses with utilization above 85% significantly impact put-away efficiency. Consider re-organizing Zone B racks or scheduling a transfer to the West Coast Depot.
                </p>
            </div>
        </div>
    </div>
  );
};

export default WarehouseCapacityView;
