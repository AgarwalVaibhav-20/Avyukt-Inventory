import React, { useState, useEffect } from 'react';
import { procurementService } from '@/services/procurementService';
import { returnsService } from '@/services/returnsService';
import { PurchaseReturn, FinancialNote } from '@/types';
import { Undo2, Banknote, Loader2, Search, Package2, FileText, IndianRupee, ArrowUpRight } from 'lucide-react';

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

  const issuedNotes = financialNotes.filter((note) => note.type === 'Debit Note').length;
  const pendingReturns = returns.filter((ret) => ret.status === 'Pending' || ret.status === 'Draft').length;
  const activeVendors = new Set(returns.map((ret) => ret.vendorName).filter(Boolean)).size;

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 via-white to-amber-50/40 p-0">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                        <Undo2 size={14} />
                        Purchase Returns
                    </div>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                        Supplier return workflow with debit note linkage
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                        Review vendor returns, issue the financial adjustment, and keep the stock-ledger handoff aligned with the backend return records.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Open returns</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{pendingReturns}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Debit notes</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{issuedNotes}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Vendors</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{activeVendors}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                        <Package2 size={20} />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Return tracking</p>
                        <p className="text-lg font-bold text-slate-900">Vendor side</p>
                    </div>
                </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                        <FileText size={20} />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Financial posting</p>
                        <p className="text-lg font-bold text-slate-900">Debit note generation</p>
                    </div>
                </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                        <IndianRupee size={20} />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Workflow status</p>
                        <p className="text-lg font-bold text-slate-900">Backend-linked</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h3 className="text-xl font-black text-slate-900">Purchase return register</h3>
                    <p className="mt-1 text-sm text-slate-500">Search the live return list and issue debit notes when the return is ready to post.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search return, vendor, item..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none ring-0 focus:border-slate-400 md:w-72" />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                        <option value="All">All Statuses</option>
                        {[...new Set(returns.map((ret) => ret.status).filter(Boolean))].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
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
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {loading ? <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="inline animate-spin"/></td></tr> : 
                         filteredReturns.length === 0 ? <tr><td colSpan={6} className="py-10 text-center text-slate-500">No returns found.</td></tr> :
                         filteredReturns.map(r => {
                             const hasDebitNote = financialNotes.some(n => n.referenceId === r.id);
                             return (
                                <tr key={r.id} className="hover:bg-slate-50/70">
                                    <td className="px-6 py-4 font-bold text-slate-700">{r.returnNumber}</td>
                                    <td className="px-6 py-4 text-slate-500">{r.date}</td>
                                    <td className="px-6 py-4 text-slate-700">{r.vendorName}</td>
                                    <td className="px-6 py-4 text-xs text-slate-600">
                                        {r.items.map((i, idx) => <div key={idx}>{i.quantity}x {i.itemName}</div>)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{r.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {hasDebitNote ? (
                                            <span className="inline-flex items-center justify-end gap-1 text-xs font-bold text-emerald-600"><Banknote size={14}/> DN Issued</span>
                                        ) : (
                                            <button 
                                                type="button"
                                                onClick={() => handleCreateDebitNote(r)}
                                                disabled={!!processingId}
                                                className="ml-auto inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                                            >
                                                {processingId === r.id ? <Loader2 size={12} className="animate-spin"/> : <ArrowUpRight size={14}/>} Issue Debit Note
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
