import React, { useState, useEffect, useCallback } from 'react';
import { reportService } from '@/services/reportService';
import { exportService } from '@/services/exportService';
import ExportDialog, { ExportPeriod, ExportFormat } from '@/components/common/ExportDialog';
import { 
  Download, 
  Search, 
  TrendingUp, 
  Package,
  IndianRupee,
  BarChart3,
  Loader2, 
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const ValuationReportDocView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // Table & Filter State
  const [allItems, setAllItems] = useState<any[]>([]);
  const [displayItems, setDisplayItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await reportService.getValuationReport();
      setData(result);
      setAllItems(result.items || []);
      setDisplayItems(result.items || []);
    } catch (error) {
      console.error('Error loading valuation report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Frontend filtering & pagination (since getValuationReport currently returns all items)
  useEffect(() => {
    let filtered = [...allItems];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.itemName.toLowerCase().includes(query) || 
        (item.sku && item.sku.toLowerCase().includes(query))
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    setDisplayItems(filtered);
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, allItems]);

  const handleExport = async (period: ExportPeriod, format: ExportFormat) => {
    await exportService.exportValuation(period, format);
  };

  const paginatedItems = displayItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(displayItems.length / pageSize);
  const categories = Array.from(new Set(allItems.map(i => i.category))).filter(Boolean);

  if (loading) return (
    <div className="flex h-screen justify-center items-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
        <p className="text-slate-600 font-medium">Calculating inventory valuation...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Inventory Valuation Report</h1>
          <p className="text-slate-600">Complete breakdown of stock worth and valuation analysis</p>
        </div>
        <button
          onClick={() => setShowExportDialog(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
        >
          <Download size={20} />
          Export Detailed Excel
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl flex justify-between items-center relative overflow-hidden">
          <div className="z-10">
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Total Inventory Value</p>
            <h3 className="text-4xl font-black mt-2">₹{(data?.totalValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h3>
            <div className="flex items-center gap-2 mt-4 text-blue-100 text-sm">
              <TrendingUp size={16} />
              <span>Current market valuation</span>
            </div>
          </div>
          <IndianRupee size={80} className="text-white/10 absolute -right-4 -bottom-4" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg flex justify-between items-center">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Items Count</p>
            <h3 className="text-4xl font-black text-slate-900 mt-2">{allItems.length}</h3>
            <p className="text-slate-400 text-sm mt-4 flex items-center gap-2">
              <Package size={16} /> Total unique products
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-slate-400">
            <BarChart3 size={32} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-lg flex justify-between items-center">
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Avg. Item Value</p>
            <h3 className="text-4xl font-black text-slate-900 mt-2">
              ₹{((data?.totalValue || 0) / (allItems.length || 1)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-slate-400 text-sm mt-4">Per unique SKU</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-500">
            <TrendingUp size={32} />
          </div>
        </div>
      </div>

      {/* Item-wise Detailed Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Detailed Stock Worth</h3>
                <p className="text-sm text-slate-500">Item-by-item breakdown of current asset value</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-500">Product</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Method</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Quantity</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Unit Price</th>
                <th className="px-8 py-5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Total Worth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.map((item) => (
                <tr key={item.itemId} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{item.itemName}</div>
                    <div className="text-xs text-slate-400 font-mono mt-1">{item.sku || 'NO SKU'}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {item.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {item.valuationMethod || 'FIFO'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-semibold text-slate-700">
                    {item.quantity.toLocaleString()}
                  </td>
                  <td className="px-6 py-5 text-right text-slate-600">
                    ₹{item.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-lg font-black text-slate-900">
                      ₹{item.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              ))}
              {displayItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <Package size={48} className="opacity-20" />
                      <p className="text-lg font-medium">No products found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {displayItems.length > 0 && (
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              Showing <span className="text-slate-900 font-bold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="text-slate-900 font-bold">{Math.min(currentPage * pageSize, displayItems.length)}</span> of{' '}
              <span className="text-slate-900 font-bold">{displayItems.length}</span> assets
            </p>

            <div className="flex items-center gap-3">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum = currentPage;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-11 h-11 rounded-xl text-sm font-black transition-all ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-lg scale-110'
                          : 'text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        reportName="Inventory Valuation Report"
      />
    </div>
  );
};

export default ValuationReportDocView;
