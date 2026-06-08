import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createBatchRecord, fetchStockControlData } from '@/store/slices/stockControlSlice';
import { Package, Calendar, Plus, Loader2, Search, Filter, Hash, Archive, AlertCircle, CheckCircle2, Clock, Info, ShieldAlert, BarChart3, Tag } from 'lucide-react';
import Pagination from '@/components/common/Pagination';
import { useListControls } from '@/hooks/useListControls';

const BatchTrackingView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { batches, items, loading, actionLoading, error } = useAppSelector((state) => state.stockControl);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Form State
  const [formData, setFormData] = useState({
      itemId: '',
      batchNumber: '',
      quantity: 0,
      mfgDate: '',
      expiryDate: '',
      costPrice: 0
  });

  useEffect(() => {
    dispatch(fetchStockControlData());
  }, [dispatch]);

  const handleCreate = async () => {
      if(!formData.itemId || !formData.batchNumber) return alert("Please fill in all mandatory fields (Item and Batch Number).");
      if(formData.quantity <= 0) return alert("Quantity must be greater than zero.");
      
      const item = items.find(i => i.id === formData.itemId);
      try {
        await dispatch(createBatchRecord({
            ...formData,
            itemName: item?.name || 'Unknown',
            sku: item?.sku || '',
        })).unwrap();
        setIsAdding(false);
        setFormData({ itemId: '', batchNumber: '', quantity: 0, mfgDate: '', expiryDate: '', costPrice: 0 });
      } catch (err) {
        console.error("Failed to create batch", err);
      }
  };

  const {
    filteredItems: filteredBatches,
    pagedItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
  } = useListControls({
    items: batches,
    searchTerm,
    filters: { status: statusFilter },
    initialPageSize: 9,
    searchFn: (b, term) =>
      b.batchNumber.toLowerCase().includes(term) ||
      b.itemName.toLowerCase().includes(term),
    filterFn: (b, filters) => filters.status === 'all' || b.status === filters.status,
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
        {/* Header Section */}
        <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-purple-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-purple-100">
                    <Package size={32}/>
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Batch & Lot Intelligence</h1>
                    <p className="text-sm text-slate-500 font-medium">Traceability and lifecycle management for serialized inventory groups.</p>
                </div>
            </div>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-3 bg-purple-600 text-white px-8 py-4 rounded-2xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 font-black text-xs uppercase tracking-widest active:scale-95"
            >
                {isAdding ? <Archive size={18}/> : <Plus size={18}/>}
                {isAdding ? 'View Registry' : 'Register New Batch'}
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content Area */}
            <div className={`transition-all duration-500 ${isAdding ? 'lg:col-span-12' : 'lg:col-span-12'}`}>
                {isAdding ? (
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-2xl relative overflow-hidden animate-slide-up">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 to-pink-600"></div>
                        <div className="flex items-center gap-4 mb-10">
                            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                                <Tag size={24}/>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Register Batch Sequence</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                    <Package size={14} className="text-purple-400"/> Product / SKU *
                                </label>
                                <select
                                    className="w-full border-2 border-slate-50 rounded-2xl p-4 text-sm bg-slate-50 focus:bg-white focus:border-purple-500/30 focus:ring-4 focus:ring-purple-500/5 outline-none transition-all font-bold text-slate-700 shadow-sm appearance-none"
                                    value={formData.itemId}
                                    onChange={e => setFormData({...formData, itemId: e.target.value})}
                                >
                                    <option value="">Select Master Item</option>
                                    {items.map(i => <option key={i.id} value={i.id}>{i.name} - {i.sku}</option>)}
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                    <Hash size={14} className="text-purple-400"/> Batch Identifier *
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full border-2 border-slate-50 rounded-2xl p-4 text-sm bg-slate-50 focus:bg-white focus:border-purple-500/30 focus:ring-4 focus:ring-purple-500/5 outline-none transition-all font-bold text-slate-700 shadow-sm" 
                                    value={formData.batchNumber} 
                                    onChange={e => setFormData({...formData, batchNumber: e.target.value})}
                                    placeholder="EX: BTCH-2024-X1"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                    <BarChart3 size={14} className="text-purple-400"/> Lot Quantity
                                </label>
                                <input 
                                    type="number" 
                                    className="w-full border-2 border-slate-50 rounded-2xl p-4 text-sm bg-slate-50 focus:bg-white focus:border-purple-500/30 outline-none transition-all font-black text-slate-800 shadow-sm" 
                                    value={formData.quantity} 
                                    onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                    <Calendar size={14} className="text-purple-400"/> Manufacturing Date
                                </label>
                                <input 
                                    type="date" 
                                    className="w-full border-2 border-slate-50 rounded-2xl p-4 text-sm bg-slate-50 focus:bg-white focus:border-purple-500/30 outline-none transition-all font-bold text-slate-700 shadow-sm" 
                                    value={formData.mfgDate} 
                                    onChange={e => setFormData({...formData, mfgDate: e.target.value})}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                    <ShieldAlert size={14} className="text-purple-400"/> Expiry Deadline
                                </label>
                                <input 
                                    type="date" 
                                    className="w-full border-2 border-slate-50 rounded-2xl p-4 text-sm bg-slate-50 focus:bg-white focus:border-purple-500/30 outline-none transition-all font-bold text-slate-700 shadow-sm" 
                                    value={formData.expiryDate} 
                                    onChange={e => setFormData({...formData, expiryDate: e.target.value})}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                    <BarChart3 size={14} className="text-purple-400"/> Unit Procurement Cost
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">₹</span>
                                    <input 
                                        type="number" 
                                        className="w-full border-2 border-slate-50 rounded-2xl p-4 pl-10 text-sm bg-slate-50 focus:bg-white focus:border-purple-500/30 outline-none transition-all font-black text-slate-800 shadow-sm" 
                                        value={formData.costPrice} 
                                        onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 border-t border-slate-100 pt-8">
                            <button 
                                onClick={() => setIsAdding(false)}
                                className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                            >
                                Discard Changes
                            </button>
                            <button 
                                onClick={handleCreate} 
                                disabled={actionLoading} 
                                className="bg-purple-600 text-white px-10 py-4 rounded-2xl hover:bg-purple-700 transition-all shadow-xl shadow-purple-100 font-black text-xs uppercase tracking-widest disabled:opacity-60 active:scale-95"
                            >
                                {actionLoading ? <Loader2 className="animate-spin-slow" size={18}/> : 'Initialize Batch Record'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Search & Stats Bar */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Filter by Batch # or Product..." 
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-purple-500/5 focus:border-purple-500/20 focus:bg-white outline-none transition-all"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full md:w-48 px-4 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-purple-500/5 focus:border-purple-500/20 focus:bg-white outline-none"
                            >
                                <option value="all">All statuses</option>
                                <option value="Active">Active</option>
                                <option value="Expired">Expired</option>
                                <option value="Depleted">Depleted</option>
                            </select>
                            <div className="flex gap-8">
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Lots</p>
                                    <p className="text-xl font-black text-slate-800">{batches.length}</p>
                                </div>
                                <div className="w-px h-8 bg-slate-100"></div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Active Records</p>
                                    <p className="text-xl font-black text-slate-800">{batches.filter(b => b.status === 'Active').length}</p>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-[1.5rem] border-2 border-red-100 bg-red-50 p-5 flex items-start gap-4 animate-shake">
                                <AlertCircle className="text-red-500 shrink-0" size={20}/>
                                <div>
                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">System Restriction</p>
                                    <p className="text-xs font-bold text-red-400 leading-relaxed">{error}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {loading && batches.length === 0 ? (
                                <div className="col-span-full py-40 text-center">
                                    <div className="w-16 h-16 border-4 border-purple-50 border-t-purple-600 rounded-full animate-spin-slow mx-auto mb-6"></div>
                                    <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Scanning Cryptographic Ledger...</p>
                                </div>
                            ) : filteredBatches.length === 0 ? (
                                <div className="col-span-full py-40 text-center">
                                    <div className="flex flex-col items-center text-slate-200">
                                        <div className="p-10 bg-slate-50 rounded-[2.5rem] mb-6">
                                            <Archive size={80} className="opacity-10"/>
                                        </div>
                                        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Registry is Clear</p>
                                    </div>
                                </div>
                            ) : (
                                pagedItems.map(b => (
                                    <div key={b.id} className="group bg-white border border-slate-200 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-purple-100 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                                        <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${b.status === 'Active' ? 'bg-emerald-600' : 'bg-red-600'}`}></div>
                                        
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex flex-col">
                                                <span className="font-mono font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-xl text-[10px] uppercase tracking-tighter border border-purple-100">
                                                    {b.batchNumber}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 opacity-60">Sequence ID</span>
                                            </div>
                                            <span className={`text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest shadow-sm border ${
                                                b.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                                            }`}>
                                                {b.status}
                                            </span>
                                        </div>

                                        <h3 className="font-black text-slate-800 text-lg mb-4 leading-tight group-hover:text-purple-600 transition-colors">{b.itemName}</h3>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Qty</p>
                                                <p className="text-lg font-black text-slate-800 tabular-nums">{b.quantity}</p>
                                            </div>
                                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Valuation</p>
                                                <p className="text-lg font-black text-slate-800 tabular-nums">₹{b.costPrice.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-slate-50">
                                            <div className="flex items-center justify-between text-[11px] font-bold">
                                                <span className="text-slate-400 flex items-center gap-2"><Calendar size={14} className="text-slate-300"/> Manufacturing</span>
                                                <span className="text-slate-600">{b.mfgDate || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] font-bold">
                                                <span className="text-red-400 flex items-center gap-2"><ShieldAlert size={14} className="text-red-300"/> Expiry Goal</span>
                                                <span className="text-red-600">{b.expiryDate || 'N/A'}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-6 flex gap-2">
                                            <button className="flex-1 bg-slate-50 text-slate-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-50 hover:text-purple-600 transition-all border border-transparent hover:border-purple-100">
                                                View Logs
                                            </button>
                                            <button className="p-3 bg-slate-50 text-slate-300 rounded-xl hover:text-purple-600 transition-colors">
                                                <Info size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalItems={totalItems}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                            pageSizeOptions={[6, 9, 18, 36]}
                        />
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default BatchTrackingView;
