import React, { useState, useEffect } from 'react';
import { salesService } from '@/services/salesService';
import { returnsService } from '@/services/returnsService';
import { SalesReturn, FinancialNote, ReplacementOrder } from '@/types';
import { Undo2, Banknote, RefreshCcw, Loader2, ArrowRight } from 'lucide-react';

const SalesReturnMgmtView: React.FC = () => {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [financialNotes, setFinancialNotes] = useState<FinancialNote[]>([]);
  const [replacements, setReplacements] = useState<ReplacementOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [rData, nData, repData] = await Promise.all([
        salesService.getSalesReturns(),
        returnsService.getFinancialNotes(),
        returnsService.getReplacements()
    ]);
    setReturns(rData);
    setFinancialNotes(nData);
    setReplacements(repData);
    setLoading(false);
  };

  const handleCreateCreditNote = async (ret: SalesReturn) => {
      setProcessingId(ret.id);
      try {
          const amount = ret.items.reduce((sum, i) => sum + (i.quantity * 20), 0); // Mock amount
          await returnsService.createFinancialNote({
              type: 'Credit Note',
              referenceId: ret.id,
              partyName: ret.customerName,
              amount,
              reason: `Sales Return - Ref: ${ret.returnNumber}`
          });
          loadData();
      } catch(e) { alert("Error"); } finally { setProcessingId(null); }
  };

  const handleCreateReplacement = async (ret: SalesReturn) => {
      setProcessingId(ret.id);
      try {
          await returnsService.createReplacement({
              type: 'Customer',
              originalReturnId: ret.id,
              itemId: ret.items[0].itemId, // Simplified: Replace first item
              itemName: ret.items[0].itemName,
              quantity: ret.items[0].quantity
          });
          loadData();
      } catch(e) { alert("Error"); } finally { setProcessingId(null); }
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Undo2 className="text-red-600" size={20}/> Sales Returns Management
            </h2>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Return #</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Items</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> : 
                         returns.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-500">No returns found.</td></tr> :
                         returns.map(r => {
                             const hasCN = financialNotes.some(n => n.referenceId === r.id);
                             const hasRep = replacements.some(rep => rep.originalReturnId === r.id);
                             
                             return (
                                <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-bold text-slate-700">{r.returnNumber}</td>
                                    <td className="px-6 py-4 text-slate-500">{r.date}</td>
                                    <td className="px-6 py-4 text-slate-700">{r.customerName}</td>
                                    <td className="px-6 py-4 text-xs">
                                        {r.items.map((i, idx) => <div key={idx}>{i.quantity}x {i.itemName}</div>)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-xs">{r.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {hasCN ? (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">CN Issued</span>
                                            ) : (
                                                <button onClick={() => handleCreateCreditNote(r)} disabled={!!processingId || hasRep} className="text-blue-600 hover:underline text-xs disabled:opacity-50">Credit Note</button>
                                            )}
                                            
                                            {hasRep ? (
                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">Replacing</span>
                                            ) : (
                                                <button onClick={() => handleCreateReplacement(r)} disabled={!!processingId || hasCN} className="text-amber-600 hover:underline text-xs disabled:opacity-50">Replace</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                             );
                         })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default SalesReturnMgmtView;
