import React, { useState, useEffect } from 'react';
import { approvalService } from '../services/approvalService';
import { PurchaseOrder } from '../types';
import { FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const PurchaseApprovalView: React.FC = () => {
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await approvalService.getPendingPOs();
    setPOs(data);
    setLoading(false);
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
      setProcessingId(id);
      try {
          if (action === 'approve') await approvalService.approvePO(id);
          else await approvalService.rejectPO(id);
          await loadData();
      } catch (e) {
          alert("Action failed");
      } finally {
          setProcessingId(null);
      }
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FileText className="text-blue-600" size={20}/> Purchase Order Approval
            </h2>

            {loading ? <div className="py-8 text-center"><Loader2 className="animate-spin inline"/></div> :
             pos.length === 0 ? <p className="text-slate-500 text-center py-8">No pending purchase orders.</p> :
             <div className="space-y-4">
                 {pos.map(po => (
                     <div key={po.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col md:flex-row justify-between gap-4">
                         <div>
                             <div className="flex items-center gap-2 mb-1">
                                 <span className="font-bold text-slate-800">{po.poNumber}</span>
                                 <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{po.status}</span>
                             </div>
                             <p className="text-sm text-slate-600">Vendor: <strong>{po.vendorName}</strong></p>
                             <p className="text-sm text-slate-500">Date: {po.date} | Total: <span className="font-medium text-slate-700">${po.totalAmount.toLocaleString()}</span></p>
                             <div className="mt-2 text-xs text-slate-500">
                                 Items: {po.items.map(i => `${i.itemName} (x${i.quantity})`).join(', ')}
                             </div>
                         </div>
                         <div className="flex gap-2 items-center">
                             <button 
                                onClick={() => handleAction(po.id, 'approve')}
                                disabled={!!processingId}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center gap-1"
                             >
                                 <CheckCircle size={16}/> Approve
                             </button>
                             <button 
                                onClick={() => handleAction(po.id, 'reject')}
                                disabled={!!processingId}
                                className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm hover:bg-red-100 flex items-center gap-1"
                             >
                                 <XCircle size={16}/> Reject
                             </button>
                         </div>
                     </div>
                 ))}
             </div>
            }
        </div>
    </div>
  );
};

export default PurchaseApprovalView;
