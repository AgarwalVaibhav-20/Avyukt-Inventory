import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStockControlData } from '@/store/slices/stockControlSlice';
import { 
    History, Search, Loader2, ArrowUpRight, ArrowDownLeft, 
    Filter, Download, Calendar, Box, MapPin, IndianRupee,
    TrendingDown, TrendingUp, ChevronRight, Hash, Activity
} from 'lucide-react';
import Pagination from '@/components/common/Pagination';
import { useListControls } from '@/hooks/useListControls';

const StockLedgerView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { ledger, loading, error } = useAppSelector((state) => state.stockControl);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'earliest'>('newest');

  useEffect(() => {
    dispatch(fetchStockControlData());
  }, [dispatch]);

  const {
    filteredItems: filtered,
    pagedItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
  } = useListControls({
    items: ledger,
    searchTerm,
    filters: { type: typeFilter, sortOrder },
    initialPageSize: 10,
    searchFn: (entry, term) =>
      entry.itemName.toLowerCase().includes(term) ||
      entry.reference.toLowerCase().includes(term) ||
      (entry.sku || '').toLowerCase().includes(term),
    filterFn: (entry, filters) =>
      filters.type === 'all' ||
      (filters.type === 'out' && entry.quantityChange < 0) ||
      (filters.type === 'in' && entry.quantityChange > 0),
  });

  const handleExport = () => {
    if (filtered.length === 0) return;
    
    const headers = ["Reference", "Date", "Item Name", "SKU", "Type", "Quantity Change", "Running Balance"];
    const csvRows = filtered.map(entry => [
      entry.reference,
      entry.date,
      entry.itemName,
      entry.sku || 'N/A',
      entry.transactionType,
      entry.quantityChange,
      entry.runningBalance
    ]);

    const csvContent = [headers, ...csvRows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Stock_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
            {/* Audited Header */}
            <div className="bg-slate-900 p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-white/5 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl">
                            <History className="text-blue-400" size={32}/>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                                Stock Ledger
                                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30 font-black uppercase tracking-widest">Audit Trail</span>
                            </h2>
                            <p className="text-slate-400 font-medium mt-1">Immutable transaction history for all stock movements</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleExport}
                            className="bg-white/10 text-white px-6 py-3 rounded-2xl hover:bg-white/20 transition-all font-black text-sm flex items-center gap-2 border border-white/10"
                        >
                            <Download size={18}/> Export Ledger
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-10">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-10">
                    <div className="relative flex-1 max-w-2xl">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                        <input 
                            type="text" 
                            placeholder="Search by SKU, Item Name, or Ref #..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-base font-bold focus:bg-white focus:border-blue-500/20 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none"
                        />
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex bg-slate-50 p-1 rounded-2xl border-2 border-slate-50">
                            {[
                                { id: 'all', label: 'All Activity', icon: Activity },
                                { id: 'in', label: 'Additions', icon: TrendingUp },
                                { id: 'out', label: 'Deductions', icon: TrendingDown }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setTypeFilter(tab.id)}
                                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                                        typeFilter === tab.id 
                                        ? 'bg-white text-blue-600 shadow-xl shadow-blue-500/10' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'earliest')}
                            className="bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-500 outline-none focus:bg-white focus:border-blue-500/20"
                        >
                            <option value="newest">Newest first</option>
                            <option value="earliest">Earliest first</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-hidden rounded-[2rem] border-2 border-slate-100 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b-2 border-slate-100">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Metadata</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Item Details</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Logistics Context</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Delta (Qty)</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Valuation Impact</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Running Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                     <tr>
                                        <td colSpan={6} className="py-32 text-center">
                                            <div className="flex flex-col items-center">
                                                <Loader2 className="animate-spin-slow text-blue-600 mb-4" size={48}/>
                                                <p className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Querying Audit Ledger...</p>
                                            </div>
                                        </td>
                                     </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-32 text-center opacity-40">
                                            <History size={64} className="mx-auto mb-4 text-slate-300"/>
                                            <p className="text-lg font-black text-slate-400 uppercase tracking-widest">No matching records found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    pagedItems.map(entry => (
                                        <tr key={entry.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                            <td className="px-8 py-7">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900 mb-1 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                                                        <Hash size={12}/> {entry.reference}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                        <Calendar size={12}/> {entry.date}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                                        <Box size={20} className="text-slate-400"/>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-800 text-base leading-none mb-1">{entry.itemName}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">SKU: {entry.sku || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-tight">
                                                        <MapPin size={12} className="text-blue-400"/> {entry.location || 'MAIN-WH-01'}
                                                    </div>
                                                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100 bg-white w-fit shadow-sm">
                                                        {entry.transactionType}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-7 text-right">
                                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-lg ${
                                                    entry.quantityChange > 0 
                                                    ? 'bg-emerald-50 text-emerald-700' 
                                                    : 'bg-rose-50 text-rose-700'
                                                }`}>
                                                    {entry.quantityChange > 0 ? '+' : ''}{entry.quantityChange}
                                                    {entry.quantityChange > 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-7 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-black text-slate-900 text-base">₹{(entry.cost || 0).toLocaleString()}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Per Unit</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-7 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-black text-slate-900 text-xl tracking-tighter">{entry.runningBalance ?? '-'}</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Level</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-2">
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalItems={totalItems}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Audit Advisory */}
        <div className="bg-blue-600 rounded-[2.5rem] p-10 flex flex-col md:flex-row gap-10 items-center shadow-2xl shadow-blue-200">
            <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center border border-white/20 shrink-0">
                <History className="text-white" size={48}/>
            </div>
            <div className="flex-1">
                <h4 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Inventory Ledger Accuracy</h4>
                <p className="text-blue-100 text-lg leading-relaxed font-medium">
                    This ledger provides a real-time audit trail of all physical stock movements. 
                    Every deduction is automatically linked to a <span className="font-black text-white underline decoration-blue-400 underline-offset-4">Dispatch Note</span> or <span className="font-black text-white underline decoration-blue-400 underline-offset-4">Stock Adjustment</span>. 
                    Ensure all manual adjustments are substantiated with proper internal documentation.
                </p>
            </div>
            <button 
                onClick={handleExport}
                className="bg-white text-blue-600 px-10 py-5 rounded-2xl font-black text-sm whitespace-nowrap hover:bg-blue-50 transition-all shadow-xl active:scale-95"
            >
                Download Audit Report
            </button>
        </div>
    </div>
  );
};

export default StockLedgerView;
