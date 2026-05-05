import React, { useState, useEffect } from 'react';
import { procurementService } from '@/services/procurementService';
import { PurchaseOrder, GRN, GRNItem } from '@/types';
import { ArrowDownToLine, Loader2, CheckSquare, Search } from 'lucide-react';

const GRNView: React.FC = () => {
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);

  // Creation State
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [challanNo, setChallanNo] = useState('');
  const [receivedItems, setReceivedItems] = useState<GRNItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [poData, grnData] = await Promise.all([
      procurementService.getAllPOs(),
      procurementService.getAllGRNs()
    ]);
    // Only show POs that aren't fully completed/cancelled for GRN creation
    setPOs(poData.filter(po => po.status !== 'Cancelled' && po.status !== 'Completed'));
    setGRNs(grnData.sort((a,b) => b.grnNumber.localeCompare(a.grnNumber)));
    setLoading(false);
  };

  const handlePOSelect = (poId: string) => {
    const po = pos.find(p => p.id === poId);
    if (!po) return;

    setSelectedPO(po);
    // Initialize received items with remaining qty
    const initItems: GRNItem[] = po.items.map(i => ({
        itemId: i.itemId,
        itemName: i.itemName,
        poQty: i.quantity,
        receivedQty: i.quantity - i.receivedQty, // Default to remaining
        acceptedQty: 0, // Filled during QC
        rejectedQty: 0
    }));
    setReceivedItems(initItems);
  };

  const updateReceivedQty = (index: number, val: number) => {
    const newItems = [...receivedItems];
    newItems[index].receivedQty = val;
    setReceivedItems(newItems);
  };

  const handleSubmit = async () => {
    if (!selectedPO || !challanNo) return alert("Missing details");
    setSubmitting(true);
    try {
        await procurementService.createGRN(selectedPO.id, challanNo, receivedItems);
        alert("GRN Created Successfully!");
        setSelectedPO(null);
        setChallanNo('');
        loadData();
    } catch (e) {
        console.error(e);
        alert("Failed to create GRN");
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Form Section */}
         <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ArrowDownToLine className="text-blue-600" size={20}/> Receive Goods
            </h2>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select PO</label>
                    <select 
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                        value={selectedPO?.id || ''}
                        onChange={(e) => handlePOSelect(e.target.value)}
                    >
                        <option value="">Select Pending PO</option>
                        {pos.map(po => (
                            <option key={po.id} value={po.id}>{po.poNumber} - {po.vendorName}</option>
                        ))}
                    </select>
                </div>

                {selectedPO && (
                    <div className="animate-fade-in space-y-4">
                        <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600">
                            <p><strong>Vendor:</strong> {selectedPO.vendorName}</p>
                            <p><strong>Date:</strong> {selectedPO.date}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Challan / Invoice No</label>
                            <input 
                                type="text" 
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                value={challanNo}
                                onChange={e => setChallanNo(e.target.value)}
                                placeholder="e.g. CH-998877"
                            />
                        </div>

                        <div className="border-t border-slate-100 pt-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Items Received</label>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {receivedItems.map((item, idx) => (
                                    <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-200 text-sm">
                                        <p className="font-medium truncate">{item.itemName}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-xs text-slate-500">Ordered: {item.poQty}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs">Rcvd:</span>
                                                <input 
                                                    type="number" 
                                                    className="w-16 border rounded p-1 text-right"
                                                    value={item.receivedQty}
                                                    onChange={e => updateReceivedQty(idx, Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={16}/> : <CheckSquare size={16}/>}
                            Generate GRN
                        </button>
                    </div>
                )}
            </div>
         </div>

         {/* List Section */}
         <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                 <h3 className="font-semibold text-slate-800">Recent GRNs</h3>
                 <span className="text-xs text-slate-500">Pending QC: {grns.filter(g => g.status === 'Pending QC').length}</span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-3">GRN No</th>
                            <th className="px-6 py-3">PO Ref</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Challan</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin inline"/> Loading...</td></tr>
                        ) : grns.length === 0 ? (
                            <tr><td colSpan={5} className="py-8 text-center text-slate-500">No GRNs generated yet.</td></tr>
                        ) : (
                            grns.map(grn => (
                                <tr key={grn.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-blue-600">{grn.grnNumber}</td>
                                    <td className="px-6 py-4">{grn.poNumber}</td>
                                    <td className="px-6 py-4 text-slate-600">{grn.date}</td>
                                    <td className="px-6 py-4 text-slate-600">{grn.challanNumber}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                            grn.status === 'QC Completed' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                        }`}>
                                            {grn.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
             </div>
         </div>
      </div>
    </div>
  );
};

export default GRNView;
