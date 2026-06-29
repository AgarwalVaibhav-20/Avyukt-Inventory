import React, { useState, useEffect } from 'react';
import { approvalService } from '@/services/approvalService';
import { warehouseService } from '@/services/warehouseService';
import { StockTransfer } from '@/types';
import { getAndClearNotifications } from '@/services/workflowEngine';
import { ArrowRightLeft, CheckCircle, XCircle, Loader2, MapPin, Search, Zap } from 'lucide-react';

const TransferApprovalView: React.FC = () => {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [warehouseNames, setWarehouseNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [wfNotifications, setWfNotifications] = useState<{ id: string; message: string }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [tData, wData] = await Promise.all([
        approvalService.getPendingTransfers(),
        warehouseService.getAllWarehouses()
    ]);
    setTransfers(tData);
    
    const wMap: Record<string, string> = {};
    wData.forEach(w => wMap[w.id] = w.name);
    setWarehouseNames(wMap);
    
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
          if (action === 'approve') await approvalService.approveTransfer(id);
          else await approvalService.rejectTransfer(id);
          await loadData();
      } catch (e) { alert("Error"); } finally { setProcessingId(null); }
  };

  const filteredTransfers = transfers.filter((trf) => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      const sourceName = warehouseNames[trf.sourceWarehouseId] || trf.sourceWarehouseId;
      const destinationName = warehouseNames[trf.destinationWarehouseId] || trf.destinationWarehouseId;
      return (
          trf.referenceNo.toLowerCase().includes(term) ||
          sourceName.toLowerCase().includes(term) ||
          destinationName.toLowerCase().includes(term) ||
          trf.items.some((item) => item.itemName.toLowerCase().includes(term))
      );
  });

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <ArrowRightLeft className="text-blue-600" size={20}/> Transfer Requests
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search transfer, warehouse, item..." className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm md:w-80" />
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
             filteredTransfers.length === 0 ? <p className="text-slate-500 text-center py-8">No active transfer requests.</p> :
             <div className="space-y-4">
                 {filteredTransfers.map(trf => (
                     <div key={trf.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-sm">
                         <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                             <div>
                                 <div className="flex items-center gap-2 mb-1">
                                     <span className="font-bold text-slate-800">{trf.referenceNo}</span>
                                     <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{trf.date}</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                                     <span className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100">
                                         <MapPin size={12}/> {warehouseNames[trf.sourceWarehouseId] || trf.sourceWarehouseId}
                                     </span>
                                     <ArrowRightLeft size={14} className="text-slate-400"/>
                                     <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">
                                         <MapPin size={12}/> {warehouseNames[trf.destinationWarehouseId] || trf.destinationWarehouseId}
                                     </span>
                                 </div>
                             </div>
                             <div className="flex gap-2 items-start">
                                 <button 
                                    onClick={() => handleAction(trf.id, 'approve')}
                                    disabled={!!processingId}
                                    className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                                 >
                                     <CheckCircle size={14}/> Approve
                                 </button>
                                 <button 
                                    onClick={() => handleAction(trf.id, 'reject')}
                                    disabled={!!processingId}
                                    className="bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded text-sm hover:bg-red-50 flex items-center gap-1"
                                 >
                                     <XCircle size={14}/> Reject
                                 </button>
                             </div>
                         </div>
                         
                         <div className="bg-slate-50 p-2 rounded text-sm border border-slate-100">
                             <p className="text-xs text-slate-500 font-semibold mb-1">Items Requested:</p>
                             <ul className="list-disc pl-4 space-y-1 text-slate-700">
                                 {trf.items.map((item, idx) => (
                                     <li key={idx}>{item.quantity} x {item.itemName}</li>
                                 ))}
                             </ul>
                         </div>
                     </div>
                 ))}
             </div>
            }
        </div>
    </div>
  );
};

export default TransferApprovalView;
