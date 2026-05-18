import React, { useState, useEffect } from 'react';
import { salesService } from '@/services/salesService';
import { SalesReturn, SalesOrder, ReturnItem } from '@/types';
import { Undo2, Search, Loader2, Package, CheckCircle2, AlertCircle, ChevronRight, CornerDownLeft, X, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SalesReturnView: React.FC = () => {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // QC Inspection Modal States
  const [isQcModalOpen, setIsQcModalOpen] = useState(false);
  const [selectedReturnForQc, setSelectedReturnForQc] = useState<any | null>(null);
  const [qcFormItems, setQcFormItems] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDispatch, setSelectedDispatch] = useState<any | null>(null);
  const [returnForm, setReturnForm] = useState({
    reason: 'Defective',
    returnType: 'Refund',
    remarks: '',
    items: [] as any[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [retData, dispData] = await Promise.all([
          salesService.getSalesReturns(),
          salesService.getWorkflowDispatches()
      ]);
      setReturns(retData);
      setDispatches(dispData.filter((d: any) => d.status === 'Delivered' || d.status === 'Dispatched'));
    } catch (error) {
      console.error("Failed to load data", error);
    }
    setLoading(false);
  };

  const handleSelectDispatch = (disp: any) => {
    setSelectedDispatch(disp);
    setReturnForm({
      reason: 'Defective',
      returnType: 'Refund',
      remarks: '',
      items: (disp.items || []).map((i: any) => ({
        ...i,
        returnQty: 0,
        lineTotal: 0,
        serialNumbersReturned: []
      }))
    });
  };

  const toggleReturnedSerial = (itemIdx: number, serial: string) => {
    const newItems = [...returnForm.items];
    const item = newItems[itemIdx];
    const currentSerials = item.serialNumbersReturned || [];
    
    let nextSerials;
    if (currentSerials.includes(serial)) {
      nextSerials = currentSerials.filter(s => s !== serial);
    } else {
      nextSerials = [...currentSerials, serial];
    }
    
    newItems[itemIdx] = {
      ...item,
      serialNumbersReturned: nextSerials,
      returnQty: nextSerials.length,
      lineTotal: nextSerials.length * (item.unitPrice || 0)
    };
    setReturnForm({ ...returnForm, items: newItems });
  };

  const updateReturnQty = (idx: number, qty: number) => {
    const newItems = [...returnForm.items];
    const item = newItems[idx];
    const maxQty = item.qty || item.quantity || 1;
    const finalQty = Math.min(qty, maxQty);
    
    newItems[idx] = {
      ...item,
      returnQty: finalQty,
      lineTotal: finalQty * (item.unitPrice || 0)
    };
    setReturnForm({ ...returnForm, items: newItems });
  };

  const handleCreateReturn = async () => {
    const activeItems = returnForm.items.filter(i => i.returnQty > 0);
    if(activeItems.length === 0) {
      alert("Please specify return quantity for at least one item.");
      return;
    }
    
    setActionLoading(true);
    try {
      const payload = {
        dispatchId: selectedDispatch.id || selectedDispatch._id,
        salesOrderId: selectedDispatch.salesOrderId,
        customerId: selectedDispatch.customerId,
        customerName: selectedDispatch.customer,
        dispatchRef: selectedDispatch.dispatchNo,
        soRef: selectedDispatch.soReference || selectedDispatch.challanRef,
        returnDate: new Date().toISOString(),
        reason: returnForm.reason,
        returnType: returnForm.returnType,
        remarks: returnForm.remarks,
        items: activeItems.map(i => ({
          productId: i.productId?._id || i.productId,
          description: i.description,
          returnQty: i.returnQty,
          unit: i.unit || 'Unit',
          unitPrice: i.unitPrice || 0,
          lineTotal: i.lineTotal,
          serialNumbers: i.serialNumbersReturned || []
        })),
        totalValue: activeItems.reduce((sum, i) => sum + i.lineTotal, 0),
        status: 'Pending'
      };

      await salesService.createSalesReturn(payload);
      alert("Return request created successfully.");
      setSelectedDispatch(null);
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to process return");
    }
    setActionLoading(false);
  };

  const handleOpenQcModal = (ret: any) => {
    setSelectedReturnForQc(ret);
    setQcFormItems((ret.items || []).map((item: any) => {
      const q = Number(item.quantity || item.returnQty || 1);
      const desc = item.itemName || item.description || "";
      
      // Auto-heal missing productId from dispatch items
      let resolvedId = item.productId?._id || item.productId || "";
      if (!resolvedId && ret.dispatchId) {
        const matchedDisp = dispatches.find((d: any) => String(d.id || d._id) === String(ret.dispatchId));
        if (matchedDisp) {
          const matchedItem = (matchedDisp.items || []).find((di: any) => 
            di.description === desc || di.itemName === desc
          );
          if (matchedItem) {
            resolvedId = matchedItem.productId?._id || matchedItem.productId;
          }
        }
      }
      
      return {
        ...item,
        productId: resolvedId || item.itemId || "",
        description: desc || "Returned Item",
        returnQty: q,
        qcPassedQty: q,
        qcFailedQty: 0,
        packagingIntact: true,
        noPhysicalDamage: true,
        serialsVerified: true,
        passedSerialNumbers: item.serialNumbers || [],
        failedSerialNumbers: []
      };
    }));
    setIsQcModalOpen(true);
  };

  const handleToggleQcSerial = (itemIdx: number, serial: string, targetList: 'pass' | 'fail') => {
    const newItems = [...qcFormItems];
    const item = newItems[itemIdx];
    
    let passed = [...(item.passedSerialNumbers || [])];
    let failed = [...(item.failedSerialNumbers || [])];
    
    if (targetList === 'pass') {
      if (!passed.includes(serial)) {
        passed.push(serial);
        failed = failed.filter(s => s !== serial);
      }
    } else {
      if (!failed.includes(serial)) {
        failed.push(serial);
        passed = passed.filter(s => s !== serial);
      }
    }
    
    newItems[itemIdx] = {
      ...item,
      passedSerialNumbers: passed,
      failedSerialNumbers: failed,
      qcPassedQty: passed.length,
      qcFailedQty: failed.length
    };
    setQcFormItems(newItems);
  };

  const handleUpdateQcQty = (itemIdx: number, passedVal: number) => {
    const newItems = [...qcFormItems];
    const item = newItems[itemIdx];
    const total = item.returnQty || item.quantity || 1;
    const finalPassed = Math.min(Math.max(passedVal, 0), total);
    
    newItems[itemIdx] = {
      ...item,
      qcPassedQty: finalPassed,
      qcFailedQty: total - finalPassed
    };
    setQcFormItems(newItems);
  };

  const handleSubmitQc = async () => {
    if (!selectedReturnForQc) return;
    
    setActionLoading(true);
    try {
      const payloadItems = qcFormItems.map(i => {
        const q = Number(i.returnQty || i.quantity || 1);
        const up = Number(i.unitPrice || 0);
        const desc = i.description || i.itemName || "";
        
        // Auto-heal missing productId from dispatch items
        let resolvedId = i.productId?._id || i.productId || "";
        if (!resolvedId && selectedReturnForQc.dispatchId) {
          const matchedDisp = dispatches.find((d: any) => String(d.id || d._id) === String(selectedReturnForQc.dispatchId));
          if (matchedDisp) {
            const matchedItem = (matchedDisp.items || []).find((di: any) => 
              di.description === desc || di.itemName === desc
            );
            if (matchedItem) {
              resolvedId = matchedItem.productId?._id || matchedItem.productId;
            }
          }
        }
        
        return {
          productId: resolvedId || i.itemId || "",
          itemId: resolvedId || i.itemId || "",
          description: desc || "Returned Item",
          returnQty: q,
          unit: i.unit || 'Unit',
          unitPrice: up,
          lineTotal: i.lineTotal || (q * up),
          qcPassedQty: Number(i.qcPassedQty || 0),
          qcFailedQty: Number(i.qcFailedQty || 0),
          serialNumbers: i.serialNumbers || [],
          passedSerialNumbers: i.passedSerialNumbers || [],
          failedSerialNumbers: i.failedSerialNumbers || []
        };
      });
      
      const totalPassed = payloadItems.reduce((sum, i) => sum + i.qcPassedQty, 0);
      const totalFailed = payloadItems.reduce((sum, i) => sum + i.qcFailedQty, 0);
      const totalReturn = payloadItems.reduce((sum, i) => sum + i.returnQty, 0);
      
      let finalQcStatus: 'Pass' | 'Fail' | 'Partial' | 'Completed' = 'Completed';
      if (totalPassed === totalReturn) {
        finalQcStatus = 'Pass';
      } else if (totalFailed === totalReturn) {
        finalQcStatus = 'Fail';
      } else if (totalPassed > 0 && totalFailed > 0) {
        finalQcStatus = 'Partial';
      }
      
      await salesService.updateSalesReturnQC(
        selectedReturnForQc.id || selectedReturnForQc._id, 
        finalQcStatus, 
        { items: payloadItems }
      );
      
      alert(`QC Quality Inspection successfully submitted! Items have been routed: ${totalPassed} units Restocked, ${totalFailed} units Scrapped.`);
      setIsQcModalOpen(false);
      setSelectedReturnForQc(null);
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to process QC Quality Inspection");
    }
    setActionLoading(false);
  };

  const handleApproveReturn = async (id: string) => {
    setActionLoading(true);
    try {
      await salesService.updateSalesReturnQC(id, 'Pass');
      alert("Return approved and items successfully restocked into warehouse inventory.");
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to approve return");
    }
    setActionLoading(false);
  };

  const filteredDispatches = dispatches.filter(d => 
      (d.dispatchNo || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (d.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.soReference || d.soRef || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.challanRef || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-slate-200">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
        <p className="text-slate-500 font-medium">Loading Return Module...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
           <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                        <CornerDownLeft className="text-red-400" size={24}/>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Outward Returns</h2>
                        <p className="text-slate-400 text-sm">Manage and track customer return requests</p>
                    </div>
                </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
               {/* Left Pane: Selection & Creation */}
               <div className="lg:col-span-7 p-6 border-r border-slate-100">
                   {!selectedDispatch ? (
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">Select Dispatch to Return</h3>
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{filteredDispatches.length} Eligible Documents</span>
                        </div>
                        
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
                            <input 
                                type="text" 
                                placeholder="Search by Dispatch No or Customer..." 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredDispatches.map(disp => (
                                <button 
                                    key={disp.id} 
                                    onClick={() => handleSelectDispatch(disp)}
                                    className="p-4 border border-slate-100 rounded-xl hover:border-red-200 hover:bg-red-50/30 transition-all flex justify-between items-center group text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-red-100 transition-colors">
                                            <Package className="text-slate-500 group-hover:text-red-600" size={20}/>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{disp.dispatchNo}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-slate-500 font-medium uppercase">{disp.customer}</span>
                                                <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded border border-blue-100">
                                                    Invoice: {disp.soReference || disp.challanRef || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-red-400 group-hover:translate-x-1 transition-all"/>
                                </button>
                            ))}
                            {filteredDispatches.length === 0 && (
                                <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <AlertCircle className="mx-auto text-slate-400 mb-2" size={24}/>
                                    <p className="text-slate-500 text-sm">No eligible dispatches found</p>
                                </div>
                            )}
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-6 animate-slide-in">
                        <div className="flex items-center justify-between">
                            <button 
                                onClick={() => setSelectedDispatch(null)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                <ChevronRight size={16} className="rotate-180"/> Back to list
                            </button>
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-tighter">
                                Return Entry
                            </span>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Source Dispatch</p>
                                <p className="font-bold text-slate-800">{selectedDispatch.dispatchNo}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Customer</p>
                                <p className="font-bold text-slate-800">{selectedDispatch.customer}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <Package size={16} className="text-slate-400"/> Select Items & Quantities
                            </h4>
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Item Description</th>
                                            <th className="px-4 py-3 text-center w-24">Shipped</th>
                                            <th className="px-4 py-3 text-center w-32">Return Qty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {returnForm.items.map((item, idx) => {
                                            const originalSerials = item.serialNumbers || [];
                                            const hasSerials = originalSerials.length > 0;
                                            
                                            return (
                                                <React.Fragment key={idx}>
                                                    <tr className={item.returnQty > 0 ? 'bg-red-50/30' : ''}>
                                                        <td className="px-4 py-3 font-medium text-slate-700">
                                                            <div>
                                                                <span className="font-bold">{item.description}</span>
                                                                {item.batchNumber && (
                                                                    <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase">
                                                                        Batch: {item.batchNumber}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-slate-500 font-bold">
                                                            {item.qty || item.quantity}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input 
                                                                type="number"
                                                                min="0"
                                                                max={item.qty || item.quantity}
                                                                disabled={hasSerials}
                                                                className="w-full text-center py-1 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:bg-slate-50 disabled:text-slate-400 font-bold"
                                                                value={item.returnQty}
                                                                onChange={e => updateReturnQty(idx, Number(e.target.value))}
                                                            />
                                                        </td>
                                                    </tr>
                                                    
                                                    {hasSerials && (
                                                        <tr className="bg-slate-50/50">
                                                            <td colSpan={3} className="px-4 py-2 border-t border-slate-100">
                                                                <div className="space-y-2">
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                                        🔢 Serial Tracking Validation (Select Returned Serials)
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {originalSerials.map((sn: string) => {
                                                                            const isSelected = (item.serialNumbersReturned || []).includes(sn);
                                                                            return (
                                                                                <button
                                                                                    key={sn}
                                                                                    type="button"
                                                                                    onClick={() => toggleReturnedSerial(idx, sn)}
                                                                                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 border ${
                                                                                        isSelected 
                                                                                            ? 'bg-red-500 border-red-500 text-white shadow-sm' 
                                                                                            : 'bg-white border-slate-200 text-slate-600 hover:border-red-300'
                                                                                    }`}
                                                                                >
                                                                                    {sn}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Return Reason</label>
                                <select 
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20"
                                    value={returnForm.reason}
                                    onChange={e => setReturnForm({...returnForm, reason: e.target.value})}
                                >
                                    <option>Defective</option>
                                    <option>Wrong Item</option>
                                    <option>Damaged in Transit</option>
                                    <option>Not as Described</option>
                                    <option>Excess Quantity</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Return Action</label>
                                <select 
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20"
                                    value={returnForm.returnType}
                                    onChange={e => setReturnForm({...returnForm, returnType: e.target.value})}
                                >
                                    <option>Refund</option>
                                    <option>Replacement</option>
                                    <option>Credit Note</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Remarks</label>
                            <textarea 
                                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20"
                                rows={3}
                                placeholder="Add any additional context or inspection notes..."
                                value={returnForm.remarks}
                                onChange={e => setReturnForm({...returnForm, remarks: e.target.value})}
                            ></textarea>
                        </div>

                        <button 
                            onClick={handleCreateReturn}
                            disabled={actionLoading}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {actionLoading ? <Loader2 className="animate-spin" size={18}/> : <CornerDownLeft size={18}/>}
                            Process Physical Return
                        </button>
                     </div>
                   )}
               </div>

               {/* Right Pane: History */}
               <div className="lg:col-span-5 bg-slate-50/50 p-6">
                   <div className="flex items-center justify-between mb-6">
                       <h3 className="font-bold text-slate-800">Return Activity</h3>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{returns.length} Logged</span>
                   </div>

                   <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                        {returns.map(ret => (
                            <div key={ret.id} className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-black text-slate-900 text-lg group-hover:text-red-600 transition-colors">{ret.returnNumber}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Ref: {ret.soNumber || ret.dispatchRef}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                                        ret.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {ret.status}
                                    </span>
                                </div>
                                
                                <div className="space-y-2">
                                    {(ret.items || []).map((item, i) => (
                                        <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            <span className="text-xs font-bold text-slate-600">{item.itemName || item.description}</span>
                                            <span className="text-xs font-black text-red-600">-{item.quantity || item.returnQty}</span>
                                        </div>
                                    ))}
                                </div>

                                 {ret.status === 'Pending' && (
                                     <div className="mt-3 flex gap-2">
                                         <Button
                                             size="sm"
                                             className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 h-9 rounded-xl shadow-sm animate-pulse"
                                             onClick={() => handleOpenQcModal(ret)}
                                             disabled={actionLoading}
                                         >
                                             <ClipboardCheck size={14} /> Start Quality Inspection (QC)
                                         </Button>
                                     </div>
                                 )}

                                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                        <AlertCircle size={12}/> {ret.reason}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{ret.date}</p>
                                </div>
                            </div>
                        ))}
                        {returns.length === 0 && (
                            <div className="py-20 text-center opacity-40 grayscale">
                                <CornerDownLeft className="mx-auto mb-2" size={40}/>
                                <p className="text-sm font-bold uppercase tracking-widest">No Returns History</p>
                            </div>
                        )}
                   </div>
               </div>
           </div>
       </div>
      {/* ================= STUNNING QC INSPECTION MODAL ================= */}
      {isQcModalOpen && selectedReturnForQc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <ClipboardCheck className="text-emerald-400" size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Quality Inspection (QC) Checklist</h3>
                  <p className="text-xs text-slate-400">Inspecting Return Request: {selectedReturnForQc.returnNumber || selectedReturnForQc.returnNo || selectedReturnForQc.returnNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsQcModalOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              
              {/* Core Quality Checklist */}
              <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50 space-y-3">
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">📋 Standard QC checklist</p>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-100 shadow-sm text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" />
                    Packaging Intact
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-100 shadow-sm text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" />
                    No Body Damage
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-100 shadow-sm text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" />
                    Serials Verified
                  </label>
                </div>
              </div>

              {/* Items List for Routing */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">📦 Route Items & Serials</p>
                
                {qcFormItems.map((item, idx) => {
                  const hasSerials = Array.isArray(item.serialNumbers) && item.serialNumbers.length > 0;
                  
                  return (
                    <div key={idx} className="p-4 border border-slate-200 rounded-2xl space-y-4">
                      
                      {/* Description & Qty Routing */}
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{item.description}</p>
                          <p className="text-xs text-slate-500 font-bold uppercase">Total Returned: {item.returnQty || item.quantity}</p>
                        </div>
                        
                        {!hasSerials && (
                          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <div>
                              <label className="block text-[8px] font-black text-slate-400 uppercase">Pass (Restock)</label>
                              <input 
                                type="number" 
                                min="0" 
                                max={item.returnQty || item.quantity} 
                                className="w-16 text-center bg-white border border-slate-200 rounded-lg text-xs font-black py-0.5"
                                value={item.qcPassedQty}
                                onChange={e => handleUpdateQcQty(idx, Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-slate-400 uppercase">Fail (Scrap)</label>
                              <span className="w-16 block text-center text-xs font-black text-red-600 py-0.5">
                                {item.qcFailedQty}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Serial Routing Interface */}
                      {hasSerials && (
                        <div className="space-y-3 pt-2 border-t border-dashed border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">🔢 Route Dispatched Serials</p>
                          
                          <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-200">
                            {/* Passed Serials Column */}
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded uppercase">Pass / Stock ({item.passedSerialNumbers.length})</span>
                              <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-white rounded-lg border border-slate-200">
                                {item.passedSerialNumbers.map((sn: string) => (
                                  <button
                                    key={sn}
                                    type="button"
                                    onClick={() => handleToggleQcSerial(idx, sn, 'fail')}
                                    className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold hover:bg-red-500 transition-colors shadow-sm"
                                    title="Click to fail / scrap serial"
                                  >
                                    {sn}
                                  </button>
                                ))}
                                {item.passedSerialNumbers.length === 0 && (
                                  <span className="text-[10px] text-slate-400 italic">None passed</span>
                                )}
                              </div>
                            </div>

                            {/* Failed Serials Column */}
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-black text-red-700 bg-red-100 px-1.5 py-0.5 rounded uppercase">Fail / Scrap ({item.failedSerialNumbers.length})</span>
                              <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-white rounded-lg border border-slate-200">
                                {item.failedSerialNumbers.map((sn: string) => (
                                  <button
                                    key={sn}
                                    type="button"
                                    onClick={() => handleToggleQcSerial(idx, sn, 'pass')}
                                    className="px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold hover:bg-emerald-500 transition-colors shadow-sm"
                                    title="Click to pass / restock serial"
                                  >
                                    {sn}
                                  </button>
                                ))}
                                {item.failedSerialNumbers.length === 0 && (
                                  <span className="text-[10px] text-slate-400 italic">None failed</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 p-6 border-t border-slate-100 flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setIsQcModalOpen(false)}
                className="h-11 rounded-xl px-6 border-slate-200 text-slate-600 font-bold hover:bg-slate-100 text-xs"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitQc}
                disabled={actionLoading}
                className="h-11 rounded-xl px-8 bg-slate-900 text-white font-bold hover:bg-black text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                Submit Inspection & Route Stock
              </Button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default SalesReturnView;
