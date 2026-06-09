import React, { useState, useEffect } from 'react';
import { approvalService } from '@/services/approvalService';
import { StockAdjustment } from '@/types';
import { AlertOctagon, CheckCircle, XCircle, Loader2, ArrowUp, ArrowDown } from 'lucide-react';

const StockAdjustmentApprovalView: React.FC = () => {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await approvalService.getPendingAdjustments();
    setAdjustments(data);
    setLoading(false);
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
      setProcessingId(id);
      try {
          if (action === 'approve') await approvalService.approveAdjustment(id);
          else await approvalService.rejectAdjustment(id);
          await loadData();
      } catch (e) { alert("Error"); } finally { setProcessingId(null); }
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <AlertOctagon className="text-orange-600" size={20}/> Stock Adjustment Approvals
            </h2>

            {loading ? <div className="py-8 text-center"><Loader2 className="animate-spin inline"/></div> :
             adjustments.length === 0 ? <p className="text-slate-500 text-center py-8">No adjustments pending approval.</p> :
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {adjustments.map(adj => (
                     <div key={adj.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-white transition-colors">
                         <div className="flex justify-between items-center mb-2">
                             <span className="font-bold text-slate-800">{adj.reference}</span>
                             <span className={`text-xs px-2 py-1 rounded font-bold ${adj.impact === 'Add' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                 {adj.impact === 'Add' ? <span className="flex items-center gap-1"><ArrowUp size={12}/> Stock Increase</span> : <span className="flex items-center gap-1"><ArrowDown size={12}/> Stock Deduction</span>}
                             </span>
                         </div>
                         <p className="text-sm font-medium text-slate-800 mb-1">{adj.itemName}</p>
                         <p className="text-xs text-slate-500 mb-1">Type: {adj.type}</p>
                         <p className="text-xs text-slate-500 mb-3 italic">" {adj.reason} "</p>
                         <div className="text-sm font-bold mb-4">Quantity: {adj.quantity}</div>

                         <div className="flex gap-2">
                             <button 
                                onClick={() => handleAction(adj.id, 'approve')}
                                disabled={!!processingId}
                                className="flex-1 bg-green-600 text-white text-xs py-2 rounded hover:bg-green-700"
                             >
                                 Approve
                             </button>
                             <button 
                                onClick={() => handleAction(adj.id, 'reject')}
                                disabled={!!processingId}
                                className="flex-1 bg-white border border-red-200 text-red-600 text-xs py-2 rounded hover:bg-red-50"
                             >
                                 Reject
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

export default StockAdjustmentApprovalView;
