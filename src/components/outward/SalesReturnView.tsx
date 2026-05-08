import React, { useState, useEffect } from 'react';
import { salesService } from '@/services/salesService';
import { SalesReturn, SalesOrder, ReturnItem } from '@/types';
import { Undo2, Search, Loader2, Package, CheckCircle2, AlertCircle, ChevronRight, CornerDownLeft } from 'lucide-react';

const SalesReturnView: React.FC = () => {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
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
        lineTotal: 0
      }))
    });
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
          lineTotal: i.lineTotal
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

  const filteredDispatches = dispatches.filter(d => 
      (d.dispatchNo || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (d.customer || '').toLowerCase().includes(searchTerm.toLowerCase())
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
                                            <p className="text-xs text-slate-500 font-medium uppercase">{disp.customer}</p>
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
                                        {returnForm.items.map((item, idx) => (
                                            <tr key={idx} className={item.returnQty > 0 ? 'bg-red-50/50' : ''}>
                                                <td className="px-4 py-3 font-medium text-slate-700">{item.description}</td>
                                                <td className="px-4 py-3 text-center text-slate-500 font-bold">{item.qty || item.quantity}</td>
                                                <td className="px-4 py-3">
                                                    <input 
                                                        type="number"
                                                        min="0"
                                                        max={item.qty || item.quantity}
                                                        className="w-full text-center py-1 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                                        value={item.returnQty}
                                                        onChange={e => updateReturnQty(idx, Number(e.target.value))}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
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
    </div>
  );
};

export default SalesReturnView;
