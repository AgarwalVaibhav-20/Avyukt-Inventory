import React, { useState, useEffect } from 'react';
import { approvalService } from '../services/approvalService';
import { PurchaseReturn, SalesReturn } from '../types';
import { Undo2, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const ReturnApprovalView: React.FC = () => {
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'purchase' | 'sales'>('purchase');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [pData, sData] = await Promise.all([
        approvalService.getPendingPurchaseReturns(),
        approvalService.getPendingSalesReturns()
    ]);
    setPurchaseReturns(pData);
    setSalesReturns(sData);
    setLoading(false);
  };

  const handleAction = async (id: string, type: 'purchase' | 'sales', action: 'approve' | 'reject') => {
      setProcessingId(id);
      try {
          if (type === 'purchase') {
              if (action === 'approve') await approvalService.approvePurchaseReturn(id);
              else await approvalService.rejectPurchaseReturn(id);
          } else {
              if (action === 'approve') await approvalService.approveSalesReturn(id);
              else await approvalService.rejectSalesReturn(id);
          }
          await loadData();
      } catch (e) { alert("Error"); } finally { setProcessingId(null); }
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => setTab('purchase')}
                    className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${tab === 'purchase' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Purchase Returns (Outward)
                </button>
                <button 
                    onClick={() => setTab('sales')}
                    className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${tab === 'sales' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Sales Returns (Inward)
                </button>
            </div>

            <div className="p-6">
                {loading ? <div className="text-center py-4"><Loader2 className="animate-spin inline"/></div> :
                 (tab === 'purchase' ? purchaseReturns : salesReturns).length === 0 ? <p className="text-center text-slate-500 py-4">No pending approvals.</p> :
                 <div className="space-y-4">
                     {(tab === 'purchase' ? purchaseReturns : salesReturns).map((ret: any) => (
                         <div key={ret.id} className="border border-slate-200 rounded-lg p-4 flex justify-between items-center bg-slate-50">
                             <div>
                                 <h4 className="font-bold text-slate-800">{ret.returnNumber}</h4>
                                 <p className="text-sm text-slate-600">{tab === 'purchase' ? `Vendor: ${ret.vendorName}` : `Customer: ${ret.customerName}`}</p>
                                 <p className="text-xs text-slate-500 mt-1">{ret.date}</p>
                                 <div className="mt-2 flex gap-2 flex-wrap">
                                     {ret.items.map((i: any, idx: number) => (
                                         <span key={idx} className="text-xs bg-white border px-2 py-1 rounded text-slate-600">
                                             {i.quantity}x {i.itemName}
                                         </span>
                                     ))}
                                 </div>
                             </div>
                             <div className="flex flex-col gap-2">
                                 <button 
                                    onClick={() => handleAction(ret.id, tab, 'approve')}
                                    disabled={!!processingId}
                                    className="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-700 flex items-center justify-center gap-1 w-24"
                                 >
                                     <CheckCircle size={14}/> Approve
                                 </button>
                                 <button 
                                    onClick={() => handleAction(ret.id, tab, 'reject')}
                                    disabled={!!processingId}
                                    className="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded text-xs hover:bg-red-50 flex items-center justify-center gap-1 w-24"
                                 >
                                     <XCircle size={14}/> Reject
                                 </button>
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

export default ReturnApprovalView;
