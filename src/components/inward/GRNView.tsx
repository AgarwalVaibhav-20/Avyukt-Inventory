import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPOs, fetchGRNs } from '@/store/slices/procurementSlice';
import { procurementService } from '@/services/procurementService';
import { warehouseService } from '@/services/warehouseService';
import { PurchaseOrder, GRN, GRNItem, Warehouse } from '@/types';
import { ArrowDownToLine, Loader2, CheckSquare, Search, Truck, Box, FileText, AlertCircle, RefreshCw, MapPin, ClipboardList, PackageCheck, Filter } from 'lucide-react';
import Pagination from '@/components/common/Pagination';
import { useListControls } from '@/hooks/useListControls';

const GRNView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { pos, grns, loading, error } = useAppSelector((state) => state.procurement);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  // Creation State
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [challanNo, setChallanNo] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [receivedItems, setReceivedItems] = useState<GRNItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ status: 'all', sortOrder: 'newest' });

  useEffect(() => {
    dispatch(fetchPOs());
    dispatch(fetchGRNs());
    loadWarehouses();
  }, [dispatch]);

  const loadWarehouses = async () => {
    try {
      const data = await warehouseService.getAllWarehouses();
      setWarehouses(data);
      if (data.length > 0) setSelectedLocation(data[0].id);
    } catch (e) {
      console.error("Failed to load warehouses", e);
    }
  };

  const handlePOSelect = (poId: string) => {
    const po = pos.find(p => p.id === poId);
    if (!po) return;

    setSelectedPO(po);
    // Initialize received items with remaining qty
    const initItems: GRNItem[] = po.items.map(i => ({
        itemId: i.itemId,
        itemName: i.itemName,
        poQty: i.quantity,
        receivedQty: Math.max(0, i.quantity - (i.receivedQty || 0)), // Default to remaining
        acceptedQty: 0,
        rejectedQty: 0
    }));
    setReceivedItems(initItems);
  };

  const updateReceivedQty = (index: number, val: number) => {
    const newItems = [...receivedItems];
    newItems[index].receivedQty = val;
    setReceivedItems(newItems);
  };

  const handleSubmit = async () => {
    if (!selectedPO || !challanNo) return alert("Please select a PO and enter Challan Number");
    if (!selectedLocation) return alert("Please select a storage location (Warehouse)");
    if (receivedItems.every(i => i.receivedQty <= 0)) return alert("Please enter received quantity for at least one item");
    
    setSubmitting(true);
    try {
        await procurementService.createGRN(
            selectedPO.id, 
            challanNo, 
            receivedItems.filter(i => i.receivedQty > 0),
            selectedLocation
        );
        setSelectedPO(null);
        setChallanNo('');
        dispatch(fetchPOs());
        dispatch(fetchGRNs());
        alert("GRN Created successfully and sent to Quality Queue.");
    } catch (e: any) {
        console.error(e);
        const msg = e.response?.data?.message || e.message || "Failed to create GRN";
        alert(`Error: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

    const {
        filteredItems: filteredGrns,
        pagedItems: pagedGrns,
        page,
        totalPages,
        totalItems,
        setPage,
    } = useListControls({
        items: grns,
        searchTerm: search,
        filters,
        initialPageSize: 8,
        searchFn: (grn, term) =>
            grn.grnNumber.toLowerCase().includes(term) ||
            (grn.poNumber || '').toLowerCase().includes(term) ||
            (grn.challanNumber || '').toLowerCase().includes(term) ||
            (grn.status || '').toLowerCase().includes(term),
        filterFn: (grn, activeFilters) =>
            activeFilters.status === 'all' || grn.status === activeFilters.status,
    });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
            <ArrowDownToLine size={24}/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Inward Dock (GRN)</h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Receive and verify inbound supplier shipments.</p>
          </div>
        </div>
        <button 
          onClick={() => { dispatch(fetchPOs()); dispatch(fetchGRNs()); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 border border-slate-100"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Form Section */}
         <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <h2 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-widest">
                    <Truck className="text-blue-600" size={20}/> Material Receipt
                </h2>
                
                <div className="space-y-6">
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                            <ClipboardList size={14} className="text-blue-400"/> Purchase Order Reference *
                        </label>
                        <select 
                            className="w-full border-2 border-slate-50 rounded-2xl p-4 text-sm bg-slate-50/50 focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-bold text-slate-700 appearance-none shadow-sm"
                            value={selectedPO?.id || ''}
                            onChange={(e) => handlePOSelect(e.target.value)}
                        >
                            <option value="">Pending Inward Orders...</option>
                            {pos.filter(po => po.status !== 'Completed' && po.status !== 'Closed').map(po => (
                                <option key={po.id} value={po.id}>{po.poNumber} — {po.vendorName}</option>
                            ))}
                        </select>
                    </div>

                    {selectedPO && (
                        <div className="animate-fade-in space-y-6">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 shadow-inner">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Supplier Profile</span>
                                    <span className="text-[10px] font-black text-blue-400 opacity-60">ID: {selectedPO.id.slice(-6)}</span>
                                </div>
                                <p className="text-base font-black text-slate-800">{selectedPO.vendorName}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded shadow-sm">
                                        <FileText size={10} className="text-blue-400"/> {selectedPO.date}
                                    </p>
                                    {selectedPO.deliveryDate && (
                                        <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded shadow-sm">
                                            <Truck size={10} className="text-blue-400"/> {selectedPO.deliveryDate}
                                        </p>
                                    )}
                                    <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded shadow-sm">
                                        <Box size={10} className="text-blue-400"/> {selectedPO.items.length} SKUs
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                                        <FileText size={14} className="text-blue-400"/> Challan / Invoice No *
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full border-2 border-slate-50 rounded-2xl p-4 text-sm bg-slate-50 focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-bold text-slate-700 shadow-sm"
                                        value={challanNo}
                                        onChange={e => setChallanNo(e.target.value)}
                                        placeholder="EX: CHN-2024-001"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                                        <MapPin size={14} className="text-blue-400"/> Unloading Warehouse *
                                    </label>
                                    <select 
                                        className="w-full border-2 border-slate-50 rounded-2xl p-4 text-sm bg-slate-50 focus:bg-white focus:border-blue-500/30 outline-none font-bold text-slate-700 transition-all shadow-sm"
                                        value={selectedLocation}
                                        onChange={e => setSelectedLocation(e.target.value)}
                                    >
                                        <option value="">Select Receiving Location</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">
                                    <PackageCheck size={14} className="text-blue-400"/> Item verification
                                </label>
                                <div className="space-y-4 max-h-[340px] overflow-y-auto pr-3 custom-scrollbar">
                                    {receivedItems.map((item, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
                                            <div className="flex justify-between items-start gap-4 mb-3">
                                                <span className="text-xs font-black text-slate-800 leading-snug">{item.itemName}</span>
                                                <div className="p-1.5 bg-slate-50 rounded-lg text-slate-300 group-hover:text-blue-400 transition-colors">
                                                    <Box size={14} />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-50">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ordered</span>
                                                    <span className="text-xs font-black text-slate-600">{item.poQty} Units</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] font-black text-blue-600 uppercase">Received:</span>
                                                    <input 
                                                        type="number" 
                                                        className="w-20 border-2 border-white rounded-xl p-2 text-sm text-center font-black text-blue-700 bg-white shadow-sm focus:border-blue-500/30 outline-none transition-all"
                                                        value={item.receivedQty}
                                                        onChange={e => updateReceivedQty(idx, Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-[1.5rem] hover:from-blue-700 hover:to-indigo-700 transition-all shadow-2xl shadow-blue-200 font-black flex justify-center items-center gap-3 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20}/> : <CheckSquare size={20}/>}
                                Finalize Receipt Note
                            </button>
                        </div>
                    )}
                </div>
            </div>
         </div>

         {/* List Section */}
         <div className="lg:col-span-8 space-y-6">
             <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden min-h-[600px]">
                 <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600">
                            <ClipboardList size={24}/>
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">
                                Goods Receipt Ledger
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Institutional Inward Monitoring</p>
                        </div>
                     </div>
                     <div className="flex gap-6">
                         <div className="text-right">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Receipts</p>
                                                         <p className="text-2xl font-black text-slate-800 tabular-nums">{filteredGrns.length}</p>
                         </div>
                         <div className="w-px h-10 bg-slate-200"></div>
                         <div className="text-right">
                             <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Awaiting Inspection</p>
                                                         <p className="text-2xl font-black text-slate-800 tabular-nums">{filteredGrns.filter(g => g.status === 'Pending QC').length}</p>
                         </div>
                     </div>
                                         <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                                                <div className="relative w-full sm:w-72">
                                                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={search}
                                                        onChange={(e) => setSearch(e.target.value)}
                                                        placeholder="Search GRN, PO, challan..."
                                                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10"
                                                    />
                                                </div>
                                                <div className="relative w-full sm:w-56">
                                                    <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <select
                                                        value={filters.status}
                                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                                        className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10"
                                                    >
                                                        <option value="all">All statuses</option>
                                                        <option value="Pending QC">Pending QC</option>
                                                        <option value="QC Completed">QC Completed</option>
                                                    </select>
                                                </div>
                                                <div className="relative w-full sm:w-44">
                                                    <Truck size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <select
                                                        value={filters.sortOrder}
                                                        onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
                                                        className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10"
                                                    >
                                                        <option value="newest">Newest first</option>
                                                        <option value="earliest">Earliest first</option>
                                                    </select>
                                                </div>
                                         </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/20 font-black tracking-[0.2em] border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-6">GRN Sequence</th>
                                <th className="px-8 py-6">PO Mapping</th>
                                <th className="px-8 py-6">Receipt Timeline</th>
                                <th className="px-8 py-6">Supplier Doc</th>
                                <th className="px-8 py-6">Current Lifecycle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && grns.length === 0 ? (
                                <tr><td colSpan={5} className="py-40 text-center">
                                    <div className="w-16 h-16 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
                                    <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Synchronizing Inbound Logs...</p>
                                </td></tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={5} className="py-40 text-center">
                                        <div className="max-w-md mx-auto bg-red-50 p-10 rounded-[2.5rem] border border-red-100">
                                            <AlertCircle className="mx-auto mb-4 text-red-400" size={48}/>
                                            <p className="font-black uppercase tracking-widest text-red-600 text-xs">Sync Interrupted</p>
                                            <p className="text-[11px] mt-2 font-bold text-red-400 uppercase tracking-tight">{error}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredGrns.length === 0 ? (
                                <tr><td colSpan={5} className="py-40 text-center">
                                    <div className="flex flex-col items-center text-slate-200">
                                        <div className="p-10 bg-slate-50 rounded-full mb-6">
                                            <FileText size={80} className="opacity-10"/>
                                        </div>
                                        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Dock is Empty</p>
                                    </div>
                                </td></tr>
                            ) : (
                                pagedGrns.map(grn => (
                                    <tr key={grn.id} className="hover:bg-slate-50/80 transition-all group border-l-4 border-l-transparent hover:border-l-blue-600">
                                        <td className="px-8 py-7 font-black text-blue-600 font-mono text-base tracking-tighter">
                                            {grn.grnNumber}
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex flex-col">
                                                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-xl font-black text-[10px] uppercase tracking-widest w-fit border border-slate-200">
                                                    {grn.poNumber}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase mt-1.5 opacity-60">Verified Linkage</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex flex-col">
                                                <span className="text-slate-700 font-black text-xs uppercase tracking-tight">{grn.date}</span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">Dock Timestamp</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                                    <FileText size={14}/>
                                                </div>
                                                <span className="text-slate-600 font-mono text-xs font-bold tracking-tight">{grn.challanNumber || 'DOC-UNSET'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm flex items-center justify-center w-36 ${
                                                grn.status === 'QC Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                grn.status === 'Pending QC' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                                {grn.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                                 </div>
                                 {totalItems > 0 && totalPages > 1 && (
                                     <div className="p-8 border-t border-slate-100">
                                         <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                                     </div>
                                 )}
             </div>
         </div>
      </div>
    </div>
  );
};

export default GRNView;
