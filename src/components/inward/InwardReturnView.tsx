import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchGRNs, fetchReturns } from '@/store/slices/procurementSlice';
import { procurementService } from '@/services/procurementService';
import { GRN, PurchaseReturn } from '@/types';
import { Undo2, AlertTriangle, FileText, Loader2, ArrowRight, RefreshCw, CheckCircle, PackageSearch } from 'lucide-react';

const InwardReturnView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { grns, returns, loading, error } = useAppSelector((state) => state.procurement);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchGRNs());
    dispatch(fetchReturns());
  }, [dispatch]);

  const rejectedGRNs = grns.filter(g => 
    g.status === 'QC Completed' && g.items.some(i => i.rejectedQty > 0)
  );

  const handleCreateReturn = async (grn: GRN) => {
    setSubmittingId(grn.id);
    
    // Auto-prepare return items from rejected qty
    const returnItems = grn.items
        .filter(i => i.rejectedQty > 0)
        .map(i => ({
            itemId: i.itemId,
            itemName: i.itemName,
            quantity: i.rejectedQty,
            reason: i.qcRemarks || 'QC Rejection'
        }));

    try {
        await procurementService.createPurchaseReturn({
            grnId: grn.id,
            vendorId: grn.vendorId,
            vendorName: grn.vendorName,
            date: new Date().toISOString().split('T')[0],
            items: returnItems,
            status: 'Draft'
        });
        dispatch(fetchReturns());
        alert("Purchase Return Note generated. Please proceed with vendor dispatch.");
    } catch (e) {
        console.error(e);
        alert("Failed to create return note. Please check backend logs.");
    } finally {
        setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Returns Management</h1>
          <p className="text-sm text-slate-500">Handle goods returning to vendors due to quality failures.</p>
        </div>
        <button 
          onClick={() => { dispatch(fetchGRNs()); dispatch(fetchReturns()); }}
          className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Pending Rejections */}
          <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Undo2 size={120} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={22}/> Pending Returns Queue
                <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">{rejectedGRNs.length}</span>
            </h2>
            
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-blue-600" size={32}/>
                </div>
            ) : rejectedGRNs.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 p-12 rounded-2xl text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <CheckCircle className="text-emerald-500" size={32}/>
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 uppercase tracking-tight">System Optimized</h3>
                    <p className="text-slate-500 text-sm">No items are currently pending for return dispatch.</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
                    {rejectedGRNs.map(grn => (
                        <div key={grn.id} className="group border border-slate-100 rounded-2xl p-5 bg-white hover:border-red-200 hover:shadow-md transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inward Ref: {grn.grnNumber}</span>
                                    <h3 className="font-black text-slate-800 text-lg leading-tight mt-1">{grn.vendorName}</h3>
                                </div>
                                <span className="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-md uppercase">{grn.date}</span>
                            </div>

                            <div className="bg-red-50/50 rounded-xl p-4 mb-4 border border-red-50">
                                <h4 className="text-[10px] font-black text-red-400 uppercase mb-3 flex items-center gap-1">
                                    <PackageSearch size={12}/> Rejected Line Items
                                </h4>
                                <div className="space-y-2">
                                    {grn.items.filter(i => i.rejectedQty > 0).map((i, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-700">{i.itemName}</span>
                                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-black">-{i.rejectedQty} Units</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={() => handleCreateReturn(grn)}
                                disabled={submittingId === grn.id}
                                className="w-full bg-slate-900 text-white py-3 rounded-xl hover:bg-red-600 transition-all font-black text-xs uppercase tracking-widest flex justify-center items-center gap-2 group-hover:shadow-lg group-hover:shadow-red-100"
                            >
                                {submittingId === grn.id ? <Loader2 className="animate-spin" size={16}/> : <Undo2 size={16}/>}
                                Generate Return Note
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </div>

          {/* Return History */}
          <div className="xl:col-span-5 bg-slate-900 rounded-2xl p-6 shadow-xl text-slate-300 h-fit">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <FileText className="text-blue-400" size={22}/> Historical Returns
            </h2>
            
            {returns.length === 0 ? (
                <div className="py-20 text-center opacity-40 italic text-sm">
                    No return notes archived yet.
                </div>
            ) : (
                <div className="overflow-y-auto max-h-[600px] space-y-4 pr-2 custom-scrollbar">
                    {returns.map(ret => (
                        <div key={ret.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 hover:border-blue-500/50 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{ret.returnNumber}</span>
                                    <p className="text-sm font-bold text-white mt-1">{ret.vendorName}</p>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    ret.status === 'Draft' ? 'bg-slate-700 text-slate-300' : 'bg-blue-900 text-blue-200'
                                }`}>
                                    {ret.status}
                                </span>
                            </div>
                            
                            <div className="space-y-2 mb-3 border-t border-slate-700/50 pt-3">
                                {ret.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-[11px]">
                                        <span className="text-slate-400">{item.itemName}</span>
                                        <span className="font-black text-white">{item.quantity} units</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                <span>Ref: {ret.grnId.slice(-8)}</span>
                                <span className="flex items-center gap-1"><RefreshCw size={10}/> {ret.date}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default InwardReturnView;
