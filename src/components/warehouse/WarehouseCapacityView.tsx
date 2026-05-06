import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCapacityStats } from '@/store/slices/warehouseSlice';
import { productService } from '@/services/productService';
import { InventoryItem } from '@/types';
import { BarChart3, Info, Loader2, AlertCircle, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WarehouseCapacityView: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { capacityStats: stats, loading, error } = useAppSelector((state) => state.warehouse);
  const [linkedItem, setLinkedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    dispatch(fetchCapacityStats());
  }, [dispatch]);

  useEffect(() => {
    const sku = searchParams.get('sku');
    const itemId = searchParams.get('item');
    if (!sku && !itemId) {
      setLinkedItem(null);
      return;
    }

    const loadLinkedItem = async () => {
      const items = await productService.getAllItems();
      setLinkedItem(items.find((item) => item.id === itemId || item.sku === sku) || null);
    };

    loadLinkedItem();
  }, [searchParams]);

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg"><BarChart3 className="text-blue-600" size={24}/></div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Warehouse Capacity Planning</h2>
                        <p className="text-sm text-slate-500">Real-time utilization metrics aggregated from live bin data.</p>
                    </div>
                </div>
                <button 
                    onClick={() => dispatch(fetchCapacityStats())}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                    Refresh Stats
                </button>
            </div>

            {linkedItem && (
                <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                            <Package size={20}/>
                        </div>
                        <div>
                            <h3 className="font-bold text-blue-950">{linkedItem.name}</h3>
                            <p className="text-xs text-blue-700 mt-1">
                                SKU {linkedItem.sku} is linked from Item Master with {linkedItem.stock} {linkedItem.stockUom || linkedItem.uom || 'units'} total stock.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {(linkedItem.stocks || []).length === 0 ? (
                                    <span className="rounded-md bg-white px-2 py-1 text-xs text-blue-700">No warehouse stock rows yet</span>
                                ) : (
                                    (linkedItem.stocks || []).map((stock, index) => (
                                        <span key={`${stock.warehouseId}-${index}`} className="rounded-md bg-white px-2 py-1 text-xs font-medium text-blue-800">
                                            Warehouse {String(stock.warehouseId).slice(-6)}: {stock.quantity}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="py-24 text-center">
                    <Loader2 className="animate-spin inline text-blue-600 mb-2" size={40}/>
                    <p className="text-slate-500 font-medium">Aggregating facility data...</p>
                </div>
            ) : error ? (
                <div className="py-12 px-6 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle size={24}/>
                    <div>
                        <p className="font-bold">Failed to load capacity data</p>
                        <p className="text-sm opacity-90">{error}</p>
                    </div>
                </div>
            ) : stats.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-xl">
                    <BarChart3 className="mx-auto text-slate-300 mb-3" size={48}/>
                    <p className="text-slate-500 font-medium">No warehouse data found to analyze.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {stats.map((wh: any) => (
                        <div key={wh.warehouseId} className="border border-slate-200 rounded-xl p-6 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-slate-800">{wh.warehouseName}</h3>
                                <div className="flex flex-col items-end">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${wh.utilizationRate > 85 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {wh.utilizationRate}% Utilized
                                    </span>
                                </div>
                            </div>

                            {/* Overall Progress */}
                            <div className="mb-8">
                                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    <span>Occupied Bins: {wh.occupiedBins}</span>
                                    <span>Total Capacity: {wh.totalBins} Bins</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${wh.utilizationRate > 85 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} 
                                        style={{width: `${wh.utilizationRate}%`}}
                                    ></div>
                                </div>
                            </div>

                            {/* Zone Breakdown Chart */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Zone-wise Volume Usage
                                </h4>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={wh.zoneStats} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9"/>
                                            <XAxis type="number" hide/>
                                            <YAxis dataKey="zoneName" type="category" width={100} tick={{fontSize: 11, fontWeight: 500, fill: '#64748b'}} axisLine={false} tickLine={false}/>
                                            <Tooltip 
                                                cursor={{fill: '#f8fafc'}}
                                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                            />
                                            <Bar dataKey="capacity" name="Total Capacity" fill="#e2e8f0" barSize={24} stackId="a" radius={[0, 4, 4, 0]} />
                                            <Bar dataKey="used" name="Current Occupancy" fill="#3b82f6" barSize={24} stackId="a" radius={[0, 0, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 flex gap-4 items-start shadow-sm">
            <div className="p-2 bg-white rounded-lg shadow-sm">
                <Info className="text-blue-600" size={20}/>
            </div>
            <div>
                <h4 className="font-bold text-blue-900 text-sm">Capacity Optimization Insights</h4>
                <p className="text-xs text-blue-700 mt-1.5 leading-relaxed">
                    Utilization data is automatically calculated based on real-time bin occupancy. Warehouses exceeding <span className="font-bold text-blue-900">85% utilization</span> are marked for review as they typically experience reduced throughput efficiency.
                </p>
            </div>
        </div>
    </div>
  );
};

export default WarehouseCapacityView;
