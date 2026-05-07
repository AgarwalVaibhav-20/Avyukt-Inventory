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

  if (loading) return (
    <div className="flex h-screen justify-center items-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
        <p className="text-slate-600 font-medium">Loading item inventory...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Item Stock Report</h1>
        <p className="text-slate-600">Detailed inventory analysis with stock valuations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Total Items</p>
              <p className="text-4xl font-bold text-blue-900 mt-3">{stats.totalItems}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-blue-600 shadow-md group-hover:shadow-lg transition-shadow">
              <Package size={28} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Total Value</p>
              <p className="text-4xl font-bold text-emerald-900 mt-3">${(stats.totalValue / 1000000).toFixed(2)}M</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-emerald-600 shadow-md group-hover:shadow-lg transition-shadow">
              <DollarSign size={28} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600">Avg Item Value</p>
              <p className="text-4xl font-bold text-cyan-900 mt-3">${(stats.avgValue).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-cyan-600 shadow-md group-hover:shadow-lg transition-shadow">
              <TrendingUp size={28} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-red-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-red-600">Low Stock Items</p>
              <p className="text-4xl font-bold text-red-900 mt-3">{stats.lowStockItems}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-red-600 shadow-md group-hover:shadow-lg transition-shadow">
              <Package size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Top Items by Value Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-2.5 text-white">
            <TrendingUp size={20} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Top 10 Items by Stock Value</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={100} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} formatter={(value: any) => `$${value}`} />
              <Bar dataKey="numValue" fill="#8b5cf6" radius={[0, 12, 12, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-white p-8 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Item Inventory Details</h3>
              <p className="text-sm text-slate-600 mt-1">Complete inventory with valuations</p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search items..."
                  className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="inline-flex items-center gap-2 border border-slate-300 px-4 py-2.5 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
                <Download size={18} /> Export
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-700">Item</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Category</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-700">Stock</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-700">Reorder Level</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-700">Unit Value</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-700">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item, index) => {
                const isLowStock = item.stock <= item.reorderLevel;
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${isLowStock ? 'border-l-4 border-red-500' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.sku}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{item.category}</td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900">
                      {item.stock} {item.uom}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">{item.reorderLevel}</td>
                    <td className="px-6 py-4 text-right">${item.unitPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-block px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-bold">
                        ${(item.stock * item.unitPrice).toLocaleString()}
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

export default ItemStockReportView;
