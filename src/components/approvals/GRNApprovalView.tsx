import React, { useState, useEffect } from 'react';
import { approvalService } from '@/services/approvalService';
import { GRN } from '@/types';
import { getAndClearNotifications } from '@/services/workflowEngine';
import { CheckSquare, CheckCircle, XCircle, Loader2, Search, Zap } from 'lucide-react';

const GRNApprovalView: React.FC = () => {
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [wfNotifications, setWfNotifications] = useState<{ id: string; message: string }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await approvalService.getPendingGRNs();
    setGRNs(data);
    setLoading(false);
    const notifications = getAndClearNotifications();
    if (notifications.length > 0) {
      setWfNotifications(notifications.map((n) => ({ id: n.id, message: n.message })));
      setTimeout(() => setWfNotifications([]), 5000);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
      setProcessingId(id);
      try {
          if (action === 'approve') await approvalService.approveGRN(id);
          else await approvalService.rejectGRN(id);
          await loadData();
      } catch (e) { alert("Error"); } finally { setProcessingId(null); }
  };

  const filteredGRNs = grns.filter((grn) => {
      const term = searchTerm.trim().toLowerCase();
      return !term ||
          grn.grnNumber.toLowerCase().includes(term) ||
          (grn.poNumber || '').toLowerCase().includes(term) ||
          (grn.vendorName || '').toLowerCase().includes(term) ||
          grn.items.some((item) => item.itemName.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <CheckSquare className="text-blue-600" size={20}/> GRN Approval (Post-QC)
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search GRN, PO, vendor, item..." className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm md:w-80" />
                </div>
            </div>

            {wfNotifications.length > 0 && (
              <div className="mb-4 space-y-2">
                {wfNotifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <Zap size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
                    {n.message}
                  </div>
                ))}
              </div>
            )}

            {loading ? <div className="py-8 text-center"><Loader2 className="animate-spin inline"/></div> :
             filteredGRNs.length === 0 ? <p className="text-slate-500 text-center py-8">No GRNs awaiting approval.</p> :
             <div className="space-y-4">
                 {filteredGRNs.map(grn => (
                     <div key={grn.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                         <div className="flex justify-between items-start mb-2">
                             <div>
                                 <h3 className="font-bold text-slate-800">{grn.grnNumber}</h3>
                                 <p className="text-sm text-slate-600">PO: {grn.poNumber} | Vendor: {grn.vendorName}</p>
                             </div>
                             <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded font-medium">QC Completed</span>
                         </div>
                         
                         <div className="bg-slate-50 p-3 rounded mb-3 text-sm">
                             {grn.items.map((i, idx) => (
                                 <div key={idx} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                                     <span>{i.itemName}</span>
                                     <div className="flex gap-3 text-xs font-medium">
                                         <span>Rcvd: {i.receivedQty}</span>
                                         <span className="text-green-600">Acc: {i.acceptedQty}</span>
                                         <span className="text-red-600">Rej: {i.rejectedQty}</span>
                                     </div>
                                 </div>
                             ))}
                         </div>

                         <div className="flex justify-end gap-2">
                             <button 
                                onClick={() => handleAction(grn.id, 'reject')}
                                disabled={!!processingId}
                                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-1"
                             >
                                 <XCircle size={16}/> Reject
                             </button>
                             <button 
                                onClick={() => handleAction(grn.id, 'approve')}
                                disabled={!!processingId}
                                className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded flex items-center gap-1"
                             >
                                 <CheckCircle size={16}/> Approve & Finalize
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

export default GRNApprovalView;
