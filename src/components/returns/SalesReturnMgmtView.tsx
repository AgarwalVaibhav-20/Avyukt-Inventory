import React, { useState, useEffect } from 'react';
import { salesService } from '@/services/salesService';
import { returnsService } from '@/services/returnsService';
import { SalesReturn, FinancialNote, ReplacementOrder } from '@/types';
import { Undo2, Loader2, Search, PackageSearch, RotateCcw, FileText, BadgeIndianRupee } from 'lucide-react';

const SalesReturnMgmtView: React.FC = () => {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [financialNotes, setFinancialNotes] = useState<FinancialNote[]>([]);
  const [replacements, setReplacements] = useState<ReplacementOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

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

  const filteredReturns = returns.filter((ret) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
          !term ||
          ret.returnNumber.toLowerCase().includes(term) ||
          ret.customerName.toLowerCase().includes(term) ||
          ret.items.some((item) => item.itemName.toLowerCase().includes(term));
      const matchesStatus = statusFilter === 'All' || ret.status === statusFilter;
      return matchesSearch && matchesStatus;
  });

  const creditNotes = financialNotes.filter((note) => note.type === 'Credit Note').length;
  const replacementsOpen = replacements.filter((rep) => rep.status !== 'Delivered' && rep.status !== 'Cancelled').length;
  const totalQty = returns.reduce((sum, ret) => sum + ret.items.reduce((lineSum, item) => lineSum + item.quantity, 0), 0);

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-0">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                        <Undo2 size={14} />
                        Sales Returns
                    </div>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                        Customer return handling with credit note and replacement actions
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                        Track returned customer goods, post the credit note to accounts receivable, and dispatch replacement items from the same screen.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Return qty</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{totalQty}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Credit notes</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{creditNotes}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Open repl.</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{replacementsOpen}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                        <PackageSearch size={20} />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Searchable</p>
                        <p className="text-lg font-bold text-slate-900">Live return list</p>
                    </div>
                </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                        <FileText size={20} />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Accounting</p>
                        <p className="text-lg font-bold text-slate-900">Credit note posting</p>
                    </div>
                </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                        <BadgeIndianRupee size={20} />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Replacement flow</p>
                        <p className="text-lg font-bold text-slate-900">Backend-linked stock action</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h3 className="text-xl font-black text-slate-900">Sales return register</h3>
                    <p className="mt-1 text-sm text-slate-500">Issue a credit note, create a replacement order, or review the return history.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search return, customer, item..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-slate-400 md:w-72" />
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
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Items</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {loading ? <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="inline animate-spin"/></td></tr> : 
                         filteredReturns.length === 0 ? <tr><td colSpan={6} className="py-10 text-center text-slate-500">No returns found.</td></tr> :
                         filteredReturns.map(r => {
                             const hasCN = financialNotes.some(n => n.referenceId === r.id);
                             const hasRep = replacements.some(rep => rep.originalReturnId === r.id);
                             
                             return (
                                <tr key={r.id} className="hover:bg-slate-50/70">
                                    <td className="px-6 py-4 font-bold text-slate-700">{r.returnNumber}</td>
                                    <td className="px-6 py-4 text-slate-500">{r.date}</td>
                                    <td className="px-6 py-4 text-slate-700">{r.customerName}</td>
                                    <td className="px-6 py-4 text-xs text-slate-600">
                                        {r.items.map((i, idx) => <div key={idx}>{i.quantity}x {i.itemName}</div>)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{r.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {hasCN ? (
                                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">CN Issued</span>
                                            ) : (
                                                <button type="button" onClick={() => handleCreateCreditNote(r)} disabled={!!processingId || hasRep} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50">Credit Note</button>
                                            )}
                                            
                                            {hasRep ? (
                                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Replacing</span>
                                            ) : (
                                                <button type="button" onClick={() => handleCreateReplacement(r)} disabled={!!processingId || hasCN} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50">Replace</button>
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
