import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchQCQueue, fetchGRNs } from '@/store/slices/procurementSlice';
import { procurementService } from '@/services/procurementService';
import { GRN, GRNItem } from '@/types';
import { ShieldCheck, CheckCircle2, XCircle, Loader2, AlertCircle, Search, ClipboardCheck, Info } from 'lucide-react';

const QualityCheckView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { qcQueue, loading, error } = useAppSelector((state) => state.procurement);
  
  const [activeGRN, setActiveGRN] = useState<GRN | null>(null);
  const [qcItems, setQcItems] = useState<GRNItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchQCQueue());
  }, [dispatch]);

  const selectGRN = (grn: GRN) => {
    setActiveGRN(grn);
    // Initialize QC data: Default accepted = received
    const items = grn.items.map(i => ({
        ...i,
        acceptedQty: i.receivedQty,
        rejectedQty: 0,
        qcRemarks: ''
    }));
    setQcItems(items);
  };

  const updateQC = (index: number, accepted: number) => {
    const newItems = [...qcItems];
    const item = newItems[index];
    if (accepted < 0 || accepted > item.receivedQty) return; // Basic validation
    
    item.acceptedQty = accepted;
    item.rejectedQty = item.receivedQty - accepted;
    setQcItems(newItems);
  };

  const updateRemarks = (index: number, remark: string) => {
    const newItems = [...qcItems];
    newItems[index].qcRemarks = remark;
    setQcItems(newItems);
  };

  const handleSubmitQC = async () => {
    if (!activeGRN) return;
    
    // Check for rejection remarks
    const needsRemarks = qcItems.some(i => i.rejectedQty > 0 && !i.qcRemarks);
    if (needsRemarks) return alert("Please provide remarks for all rejected items.");

    setSubmitting(true);
    try {
        await procurementService.updateQC((activeGRN as any).inspectionId || activeGRN.id, qcItems);
        setActiveGRN(null);
        dispatch(fetchQCQueue());
        dispatch(fetchGRNs());
        alert("Quality Check successful. GRN moved to the approval queue.");
    } catch (e) {
        console.error(e);
        alert("Failed to submit QC. Check connection to backend.");
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quality Inspection</h1>
          <p className="text-sm text-slate-500">Verify and approve incoming inventory quality.</p>
        </div>
      </div>

      {/* Queue Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="text-blue-600" size={22}/> Inspection Queue
                <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{qcQueue.length}</span>
            </h2>
          </div>
          
          {loading ? (
             <div className="flex justify-center py-12">
                <div className="text-center">
                    <Loader2 className="animate-spin-slow text-blue-600 mx-auto mb-2" size={32}/>
                    <p className="text-slate-500 text-sm font-medium">Refreshing inspection queue...</p>
                </div>
             </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 p-8 rounded-xl text-center">
                <AlertCircle className="text-red-500 mx-auto mb-2" size={32}/>
                <p className="text-red-700 font-bold">Failed to load queue</p>
                <p className="text-red-500 text-xs">{error}</p>
            </div>
          ) : qcQueue.length === 0 ? (
             <div className="bg-slate-50 border border-dashed border-slate-200 p-12 rounded-xl text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <CheckCircle2 className="text-emerald-500" size={32}/>
                </div>
                <h3 className="text-lg font-bold text-slate-700">All Clear!</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">There are currently no shipments pending quality inspection.</p>
             </div>
          ) : (
             <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {qcQueue.map(grn => (
                    <button 
                        key={grn.id}
                        onClick={() => selectGRN(grn)}
                        className={`min-w-[280px] p-5 rounded-2xl border-2 text-left transition-all relative group ${
                            activeGRN?.id === grn.id 
                            ? 'bg-blue-50 border-blue-600 shadow-md ring-4 ring-blue-500/5' 
                            : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-sm'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-blue-600 font-black text-sm tracking-tight">{grn.grnNumber}</span>
                            <Info size={14} className="text-slate-300" />
                        </div>
                        <p className="font-bold text-slate-800 text-base leading-tight mb-1">{grn.vendorName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{grn.date}</p>
                        
                        <div className="mt-4 flex items-center gap-2">
                            <span className="bg-white px-2 py-1 rounded text-[10px] font-bold text-slate-500 border border-slate-100">{grn.items.length} SKUs</span>
                            <span className="text-[10px] text-slate-400">Ref: {grn.poNumber}</span>
                        </div>
                    </button>
                ))}
             </div>
          )}
      </div>

      {/* QC Form */}
      {activeGRN && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in-up relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-emerald-100">Live Inspection</span>
                        <h3 className="font-black text-xl text-slate-800 tracking-tight">{activeGRN.grnNumber}</h3>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Challan Reference: <span className="font-bold text-slate-700">{activeGRN.challanNumber}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveGRN(null)}
                        className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-50 font-bold text-xs"
                      >
                        Discard
                      </button>
                      <button 
                        onClick={handleSubmitQC}
                        disabled={submitting}
                        className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-2 text-sm font-black shadow-lg shadow-emerald-100"
                      >
                        {submitting ? <Loader2 className="animate-spin-slow" size={18}/> : <ClipboardCheck size={18}/>}
                        Complete Inspection
                      </button>
                  </div>
              </div>
              
              <div className="p-0 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
                          <tr>
                              <th className="px-6 py-4">Inventory SKU & Name</th>
                              <th className="px-6 py-4 text-center">HSN / Tax</th>
                              <th className="px-6 py-4 text-right">Unit Price</th>
                              <th className="px-6 py-4 w-32 text-center">Inward Qty</th>
                              <th className="px-6 py-4 w-40 text-center">Accepted / OK</th>
                              <th className="px-6 py-4 w-32 text-center">Rejected</th>
                              <th className="px-6 py-4">QC Findings / Remarks</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {qcItems.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="px-6 py-5">
                                      <div className="font-bold text-slate-800 text-sm mb-0.5">{item.itemName}</div>
                                      <div className="text-[10px] text-slate-400 font-bold font-mono">ID: {item.itemId}</div>
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                      <div className="text-xs font-bold text-slate-600">{item.hsnCode || 'N/A'}</div>
                                      <div className="text-[10px] text-emerald-600 font-bold">{item.taxRate}% GST</div>
                                  </td>
                                  <td className="px-6 py-5 text-right">
                                      <span className="font-bold text-slate-600 text-sm">₹{(item.unitPrice || 0).toLocaleString("en-IN")}</span>
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-black text-sm">{item.receivedQty}</span>
                                  </td>
                                  <td className="px-6 py-5">
                                      <div className="flex justify-center">
                                         <input 
                                            type="number" 
                                            className="w-24 border border-emerald-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl p-2 text-center bg-emerald-50/30 text-emerald-700 font-black text-lg outline-none transition-all"
                                            value={item.acceptedQty}
                                            onChange={e => updateQC(idx, Number(e.target.value))}
                                         />
                                      </div>
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto font-black text-lg ${item.rejectedQty > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'text-slate-200'}`}>
                                          {item.rejectedQty}
                                      </div>
                                  </td>
                                  <td className="px-6 py-5">
                                      <div className="relative">
                                          <input 
                                            type="text" 
                                            placeholder={item.rejectedQty > 0 ? "⚠️ Detail why rejected..." : "Type QC findings..."}
                                            className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${item.rejectedQty > 0 && !item.qcRemarks ? 'border-red-300 bg-red-50 focus:ring-red-500/20' : 'border-slate-100 bg-slate-50 focus:bg-white focus:ring-blue-500/10'}`}
                                            value={item.qcRemarks || ''}
                                            onChange={e => updateRemarks(idx, e.target.value)}
                                          />
                                          {item.rejectedQty > 0 && (
                                              <XCircle className="absolute right-3 top-3 text-red-400" size={16} />
                                          )}
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}
    </div>
  );
};

export default QualityCheckView;
