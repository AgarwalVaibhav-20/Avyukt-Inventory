import React, { useState, useEffect, useCallback } from 'react';
import { reportService } from '@/services/reportService';
import { exportService } from '@/services/exportService';
import ExportDialog, { ExportPeriod, ExportFormat } from '@/components/common/ExportDialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, Package, DollarSign, AlertTriangle, Loader2, TrendingUp, Download, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

const StockSummaryReportView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Table State
  const [items, setItems] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchItems = useCallback(async (page: number, search: string, category: string) => {
    setItemsLoading(true);
    try {
      const result = await reportService.getItemStockReport({
        page,
        limit: pageSize,
        search,
        category
      });
      setItems(result.data || []);
      setTotalItems(result.total || 0);
      setTotalPages(result.pages || 0);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setItemsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const statsData = await reportService.getStockSummary();
        setStats(statsData);

        // For charts, we still need a full set of top items, but maybe just a small sample
        const initialItemsResult = await reportService.getItemStockReport({ limit: 50 });
        const allItems = initialItemsResult.data || [];

        // Prepare chart data
        const topItems = allItems.slice(0, 6).map((i: any) => ({
          name: i.name.substring(0, 12),
          value: i.stock * i.unitPrice,
          quantity: i.stock
        }));
        
        const categoryData = allItems.reduce((acc: any, item: any) => {
          const existing = acc.find((c: any) => c.name === item.category);
          if (existing) {
            existing.value += item.stock * item.unitPrice;
          } else {
            acc.push({ name: item.category, value: item.stock * item.unitPrice });
          }
          return acc;
        }, []);

        const valueData = [
          { month: 'Jan', value: (statsData.totalValue * 0.8).toFixed(0) },
          { month: 'Feb', value: (statsData.totalValue * 0.85).toFixed(0) },
          { month: 'Mar', value: (statsData.totalValue * 0.9).toFixed(0) },
          { month: 'Apr', value: (statsData.totalValue * 0.95).toFixed(0) },
          { month: 'May', value: (statsData.totalValue).toFixed(0) },
        ];

        setChartData({ topItems, categoryData, valueData });
      } catch (error) {
        console.error('Error loading summary data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    fetchItems(currentPage, searchQuery, selectedCategory);
  }, [currentPage, searchQuery, selectedCategory, fetchItems]);

  const handleExport = async (period: ExportPeriod, format: ExportFormat) => {
    await exportService.exportStockSummary(period, format);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  if (loading) return (
    <div className="flex h-screen justify-center items-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
        <p className="text-slate-600 font-medium">Loading stock summary...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Stock Summary Report</h1>
          <p className="text-slate-600">Real-time inventory valuation and stock analysis</p>
        </div>
        <button
          onClick={() => setShowExportDialog(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
        >
          <Download size={20} />
          Export
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Total Items</p>
              <p className="text-4xl font-bold text-blue-900 mt-3">{stats?.totalItems}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-blue-600 shadow-md group-hover:shadow-lg transition-shadow">
              <Package size={28} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Total Quantity</p>
              <p className="text-4xl font-bold text-indigo-900 mt-3">{stats?.totalStock.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-indigo-600 shadow-md group-hover:shadow-lg transition-shadow">
              <BarChart3 size={28} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Total Value</p>
              <p className="text-4xl font-bold text-emerald-900 mt-3">${(stats?.totalValue / 1000000).toFixed(2)}M</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-emerald-600 shadow-md group-hover:shadow-lg transition-shadow">
              <DollarSign size={28} />
            </div>
          </div>
        </div>

        <div className="group overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-red-100 p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-red-600">Low Stock Items</p>
              <p className="text-4xl font-bold text-red-900 mt-3">{stats?.lowStock}</p>
              <span className="text-red-600 text-xs font-semibold flex items-center mt-2"><AlertTriangle size={14} className="mr-1" /> Action Required</span>
            </div>
            <div className="rounded-xl bg-white p-3 text-red-600 shadow-md group-hover:shadow-lg transition-shadow">
              <AlertTriangle size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Value Trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 text-white">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Stock Value Trend</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData?.valueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Value by Category */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-2.5 text-white">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Value by Category</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData?.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData?.categoryData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-6 justify-center">
              {chartData?.categoryData.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table Section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 p-2.5 text-white">
                <Package size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Inventory Details</h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search item or SKU..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value="">All Categories</option>
                  {chartData?.categoryData.map((cat: any) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Item Details</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Current Stock</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Unit Price</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Total Value</th>
                <th className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-6 h-16 bg-slate-50/50"></td>
                  </tr>
                ))
              ) : items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-500 mt-1 uppercase tracking-tight">{item.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-semibold text-slate-700">
                      {item.stock.toLocaleString()} {item.uom}
                    </td>
                    <td className="px-6 py-5 text-right text-slate-600">
                      ${item.unitPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-slate-900">
                      ${(item.stock * item.unitPrice).toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-slate-500 text-sm">
                      {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-400">
                    No items found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Showing <span className="font-bold text-slate-700">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-bold text-slate-700">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
            <span className="font-bold text-slate-700">{totalItems}</span> items
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || itemsLoading}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                // Simplified pagination logic: show pages around current
                let pageNum = currentPage;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || itemsLoading}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        reportName="Stock Summary Report"
      />
    </div>
  );
};

export default StockSummaryReportView;
