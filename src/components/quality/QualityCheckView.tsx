import React, { useState, useEffect } from 'react';
import { procurementService } from '@/services/procurementService';
import { GRN, GRNItem } from '@/types';
import { ShieldCheck, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const QualityCheckView: React.FC = () => {
  const [pendingGRNs, setPendingGRNs] = useState<GRN[]>([]);
  const [activeGRN, setActiveGRN] = useState<GRN | null>(null);
  const [qcItems, setQcItems] = useState<GRNItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const all = await procurementService.getAllGRNs();
    setPendingGRNs(all.filter(g => g.status === 'Pending QC'));
    setLoading(false);
  };

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
    setSubmitting(true);
    try {
        await procurementService.updateQC(activeGRN.id, qcItems);
        alert("Quality Check Submitted & Stock Updated!");
        setActiveGRN(null);
        loadData();
    } catch (e) {
        console.error(e);
        alert("Failed to submit QC");
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Selector List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={20}/> Quality Inspection Queue
          </h2>
          
          {loading ? (
             <div className="text-center py-4 text-slate-500">Loading...</div>
          ) : pendingGRNs.length === 0 ? (
             <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center text-sm">
                No GRNs pending for Quality Check.
             </div>
          ) : (
             <div className="flex gap-4 overflow-x-auto pb-2">
                {pendingGRNs.map(grn => (
                    <button 
                        key={grn.id}
                        onClick={() => selectGRN(grn)}
                        className={`min-w-[200px] p-4 rounded-lg border text-left transition-colors ${
                            activeGRN?.id === grn.id 
                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                            : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                    >
                        <p className="font-bold text-slate-700 text-sm">{grn.grnNumber}</p>
                        <p className="text-xs text-slate-500 mt-1">{grn.vendorName}</p>
                        <p className="text-xs text-slate-400 mt-1">{grn.date}</p>
                    </button>
                ))}
             </div>
          )}
      </div>

      {/* QC Form */}
      {activeGRN && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div>
                      <h3 className="font-bold text-slate-800">Inspecting: {activeGRN.grnNumber}</h3>
                      <p className="text-xs text-slate-500">Challan: {activeGRN.challanNumber}</p>
                  </div>
                  <button 
                    onClick={handleSubmitQC}
                    disabled={submitting}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
                    Approve & Update Stock
                  </button>
              </div>
              
              <div className="p-6">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                          <tr>
                              <th className="p-3">Item Details</th>
                              <th className="p-3 w-32 text-center">Received</th>
                              <th className="p-3 w-32 text-center">Accepted</th>
                              <th className="p-3 w-32 text-center">Rejected</th>
                              <th className="p-3">Remarks</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {qcItems.map((item, idx) => (
                              <tr key={idx}>
                                  <td className="p-3 font-medium text-slate-700">
                                      {item.itemName}
                                      <div className="text-xs text-slate-400 font-normal">SKU ID: {item.itemId}</div>
                                  </td>
                                  <td className="p-3 text-center bg-slate-50 font-medium">
                                      {item.receivedQty}
                                  </td>
                                  <td className="p-3">
                                      <div className="flex justify-center">
                                         <input 
                                            type="number" 
                                            className="w-20 border border-green-200 focus:border-green-500 focus:ring-green-500 rounded p-1 text-center bg-green-50 text-green-800 font-bold"
                                            value={item.acceptedQty}
                                            onChange={e => updateQC(idx, Number(e.target.value))}
                                         />
                                      </div>
                                  </td>
                                  <td className="p-3 text-center">
                                      <span className={`font-bold ${item.rejectedQty > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                                          {item.rejectedQty}
                                      </span>
                                  </td>
                                  <td className="p-3">
                                      <input 
                                        type="text" 
                                        placeholder={item.rejectedQty > 0 ? "Reason for rejection required" : "Optional remarks"}
                                        className={`w-full border rounded px-2 py-1 ${item.rejectedQty > 0 && !item.qcRemarks ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                        value={item.qcRemarks || ''}
                                        onChange={e => updateRemarks(idx, e.target.value)}
                                      />
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
