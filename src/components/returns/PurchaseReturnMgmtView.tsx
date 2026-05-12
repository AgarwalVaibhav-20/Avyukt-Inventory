import React, { useState, useEffect } from 'react';
import { procurementService } from '@/services/procurementService';
import { returnsService } from '@/services/returnsService';
import { PurchaseReturn, FinancialNote } from '@/types';
import { Undo2, Banknote, Loader2, Search } from 'lucide-react';

const PurchaseReturnMgmtView: React.FC = () => {
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [financialNotes, setFinancialNotes] = useState<FinancialNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [rData, nData] = await Promise.all([
        procurementService.getPurchaseReturns(),
        returnsService.getFinancialNotes()
    ]);
    setReturns(rData);
    setFinancialNotes(nData);
    setLoading(false);
  };

  const handleCreateDebitNote = async (ret: PurchaseReturn) => {
      if(financialNotes.some(n => n.referenceId === ret.id)) return alert("Debit Note already exists for this return.");
      
      setProcessingId(ret.id);
      try {
          // Calculate mock amount based on quantity (assuming standard price of $10 for demo if not avail)
          const estimatedAmount = ret.items.reduce((sum, i) => sum + (i.quantity * 10), 0); 
          
          await returnsService.createFinancialNote({
              type: 'Debit Note',
              referenceId: ret.id,
              partyName: ret.vendorName,
              amount: estimatedAmount,
              reason: `Return of Goods - Ref: ${ret.returnNumber}`
          });
          alert("Debit Note Issued");
          loadData();
      } catch(e) {
          alert("Error creating note");
      } finally {
          setProcessingId(null);
      }
  };

  const filteredReturns = returns.filter((ret) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
          !term ||
          ret.returnNumber.toLowerCase().includes(term) ||
          ret.vendorName.toLowerCase().includes(term) ||
          ret.items.some((item) => item.itemName.toLowerCase().includes(term));
      const matchesStatus = statusFilter === 'All' || ret.status === statusFilter;
      return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Undo2 className="text-red-600" size={20}/> Purchase Returns Management
                </h2>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search return, vendor, item..." className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm md:w-72" />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                        <option value="All">All Statuses</option>
                        {[...new Set(returns.map((ret) => ret.status).filter(Boolean))].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Return #</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Vendor</th>
                            <th className="px-6 py-4">Items</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> : 
                         filteredReturns.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-500">No returns found.</td></tr> :
                         filteredReturns.map(r => {
                             const hasDebitNote = financialNotes.some(n => n.referenceId === r.id);
                             return (
                                <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-bold text-slate-700">{r.returnNumber}</td>
                                    <td className="px-6 py-4 text-slate-500">{r.date}</td>
                                    <td className="px-6 py-4 text-slate-700">{r.vendorName}</td>
                                    <td className="px-6 py-4 text-xs">
                                        {r.items.map((i, idx) => <div key={idx}>{i.quantity}x {i.itemName}</div>)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-xs">{r.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {hasDebitNote ? (
                                            <span className="text-green-600 text-xs font-bold flex items-center justify-end gap-1"><Banknote size={14}/> DN Issued</span>
                                        ) : (
                                            <button 
                                                type="button"
                                                onClick={() => handleCreateDebitNote(r)}
                                                disabled={!!processingId}
                                                className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-xs font-medium flex items-center gap-1 ml-auto"
                                            >
                                                {processingId === r.id ? <Loader2 size={12} className="animate-spin"/> : <Banknote size={14}/>} Issue Debit Note
                                            </button>
                                        )}
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

export default PurchaseReturnMgmtView;
