import React, { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { InventoryItem } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Download, Loader2, Package, DollarSign, TrendingUp } from 'lucide-react';

const ItemStockReportView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await reportService.getItemStockReport();
    setItems(data);
    
    // Calculate statistics
    const totalValue = data.reduce((sum, i) => sum + (i.stock * i.unitPrice), 0);
    const lowStockItems = data.filter(i => i.stock <= i.reorderLevel).length;
    const avgValue = totalValue / data.length;

    setStats({
      totalItems: data.length,
      totalValue,
      lowStockItems,
      avgValue
    });

    // Top 10 items by value for chart
    const topItems = data
      .sort((a, b) => (b.stock * b.unitPrice) - (a.stock * a.unitPrice))
      .slice(0, 10)
      .map(i => ({
        name: i.name.substring(0, 15),
        value: (i.stock * i.unitPrice).toLocaleString('en-US', { maximumFractionDigits: 0 }),
        numValue: i.stock * i.unitPrice
      }));

    setChartData(topItems);
    setLoading(false);
  };

  const filtered = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.sku.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex h-64 justify-center items-center"><Loader2 className="animate-spin text-slate-400"/></div>;

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Items</p>
                        <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalItems}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Package size={24}/></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Total Value</p>
                        <h3 className="text-3xl font-bold text-green-600 mt-2">${(stats.totalValue / 1000000).toFixed(2)}M</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-green-600"><DollarSign size={24}/></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Avg Item Value</p>
                        <h3 className="text-3xl font-bold text-blue-600 mt-2">${(stats.avgValue).toLocaleString('en-US', { maximumFractionDigits: 0 })}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><TrendingUp size={24}/></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Low Stock Items</p>
                        <h3 className="text-3xl font-bold text-red-600 mt-2">{stats.lowStockItems}</h3>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg text-red-600"><Package size={24}/></div>
                </div>
            </div>
        </div>

        {/* Top Items by Value Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Top 10 Items by Stock Value</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={100} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => `$${value}`} />
                        <Bar dataKey="numValue" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Item Inventory Details</h3>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                        <input 
                            type="text" 
                            placeholder="Filter Items..." 
                            className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            value={search} 
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
                        <Download size={16}/> Export
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4 text-right">Stock</th>
                            <th className="px-6 py-4 text-right">Reorder Level</th>
                            <th className="px-6 py-4 text-right">Unit Value</th>
                            <th className="px-6 py-4 text-right">Total Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                         {filtered.map(item => {
                             const isLowStock = item.stock <= item.reorderLevel;
                             return (
                                <tr key={item.id} className={`hover:bg-slate-50 ${isLowStock ? 'bg-red-50/50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800">{item.name}</p>
                                        <p className="text-xs text-slate-500">{item.sku}</p>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{item.category}</td>
                                    <td className="px-6 py-4 text-right font-medium">{item.stock} {item.uom}</td>
                                    <td className="px-6 py-4 text-right text-slate-500">{item.reorderLevel}</td>
                                    <td className="px-6 py-4 text-right">${item.unitPrice.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-blue-700">${(item.stock * item.unitPrice).toLocaleString()}</td>
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

export default ItemStockReportView;
