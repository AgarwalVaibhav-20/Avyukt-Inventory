import React, { useState, useEffect } from 'react';
import { procurementService } from '../services/procurementService';
import { GRN, PurchaseReturn } from '../types';
import { Undo2, AlertTriangle, FileText, Loader2, ArrowRight } from 'lucide-react';

const InwardReturnView: React.FC = () => {
  const [rejectedGRNs, setRejectedGRNs] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null);
  const [returnsHistory, setReturnsHistory] = useState<PurchaseReturn[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [allGRNs, allReturns] = await Promise.all([
        procurementService.getAllGRNs(),
        procurementService.getPurchaseReturns()
    ]);

    // Find GRNs with Rejected Items that haven't been fully returned (simplified logic)
    const withRejections = allGRNs.filter(g => 
        g.status === 'QC Completed' && g.items.some(i => i.rejectedQty > 0)
    );
    setRejectedGRNs(withRejections);
    setReturnsHistory(allReturns);
    setLoading(false);
  };

  const handleCreateReturn = async () => {
    if (!selectedGRN) return;
    setSubmitting(true);
    
    // Auto-prepare return items from rejected qty
    const returnItems = selectedGRN.items
        .filter(i => i.rejectedQty > 0)
        .map(i => ({
            itemId: i.itemId,
            itemName: i.itemName,
            quantity: i.rejectedQty,
            reason: i.qcRemarks || 'QC Rejection'
        }));

    try {
        await procurementService.createPurchaseReturn({
            grnId: selectedGRN.id,
            vendorId: selectedGRN.vendorId,
            vendorName: selectedGRN.vendorName,
            date: new Date().toISOString().split('T')[0],
            items: returnItems,
            status: 'Draft'
        });
        alert("Return Note Created!");
        setSelectedGRN(null);
        loadData();
    } catch (e) {
        console.error(e);
        alert("Failed to create return");
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Rejections */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20}/> Pending Returns (QC Rejected)
            </h2>
            
            {loading ? <div className="text-center py-8 text-slate-500">Loading...</div> : 
             rejectedGRNs.length === 0 ? <p className="text-slate-500 text-sm">No pending rejections found.</p> :
             <div className="space-y-4">
                 {rejectedGRNs.map(grn => (
                     <div key={grn.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                         <div className="flex justify-between mb-2">
                             <span className="font-bold text-slate-700">{grn.grnNumber}</span>
                             <span className="text-xs text-slate-500">{grn.date}</span>
                         </div>
                         <p className="text-sm text-slate-600 mb-2">Vendor: {grn.vendorName}</p>
                         <div className="bg-white border border-slate-200 rounded p-2 mb-3">
                             {grn.items.filter(i => i.rejectedQty > 0).map((i, idx) => (
                                 <div key={idx} className="flex justify-between text-xs text-red-600 font-medium">
                                     <span>{i.itemName}</span>
                                     <span>{i.rejectedQty} Rejected</span>
                                 </div>
                             ))}
                         </div>
                         <button 
                            onClick={() => { setSelectedGRN(grn); handleCreateReturn(); }}
                            disabled={submitting}
                            className="w-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 py-2 rounded text-sm font-medium flex justify-center items-center gap-2"
                         >
                            {submitting && selectedGRN?.id === grn.id ? <Loader2 className="animate-spin" size={16}/> : <Undo2 size={16}/>}
                            Create Return Note
                         </button>
                     </div>
                 ))}
             </div>
            }
          </div>

          {/* Return History */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="text-blue-600" size={20}/> Return History
            </h2>
            
            {returnsHistory.length === 0 ? <p className="text-slate-500 text-sm">No return notes created yet.</p> :
             <div className="overflow-y-auto max-h-[500px] space-y-3">
                 {returnsHistory.map(ret => (
                     <div key={ret.id} className="border-b border-slate-100 pb-3 last:border-0">
                         <div className="flex justify-between items-center mb-1">
                             <span className="text-sm font-bold text-slate-700">{ret.returnNumber}</span>
                             <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{ret.status}</span>
                         </div>
                         <p className="text-xs text-slate-500 mb-2">{ret.vendorName} | {ret.date}</p>
                         <div className="space-y-1">
                             {ret.items.map((item, idx) => (
                                 <div key={idx} className="text-xs flex gap-2 text-slate-600">
                                     <span className="font-medium">{item.quantity}x</span>
                                     <span className="truncate">{item.itemName}</span>
                                 </div>
                             ))}
                         </div>
                     </div>
                 ))}
             </div>
            }
          </div>
      </div>
    </div>
  );
};

export default InwardReturnView;
