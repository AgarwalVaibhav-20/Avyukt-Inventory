import React, { useState, useEffect } from 'react';
import { returnsService } from '@/services/returnsService';
import { FinancialNote } from '@/types';
import { Banknote, Loader2, FileText, IndianRupee, Landmark } from 'lucide-react';

const DebitCreditNotesView: React.FC = () => {
  const [notes, setNotes] = useState<FinancialNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await returnsService.getFinancialNotes();
    setNotes(data);
    setLoading(false);
  };

  const debitCount = notes.filter((note) => note.type === 'Debit Note').length;
  const creditCount = notes.filter((note) => note.type === 'Credit Note').length;
  const totalAmount = notes.reduce((sum, note) => sum + note.amount, 0);

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-0">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        <Banknote size={14} />
                        Financial Notes
                    </div>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                        Debit and credit note register for return postings
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                        View every note linked to a return, understand the party impact, and keep the return valuation aligned with posted accounting entries.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Debit notes</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{debitCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Credit notes</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{creditCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total amount</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">₹{totalAmount.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                        <FileText size={20} />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Posting</p>
                        <p className="text-lg font-bold text-slate-900">Return-linked adjustments</p>
                    </div>
                </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                        <IndianRupee size={20} />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Amount</p>
                        <p className="text-lg font-bold text-slate-900">Aggregated value view</p>
                    </div>
                </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                        <Landmark size={20} />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Source</p>
                        <p className="text-lg font-bold text-slate-900">Purchase and sales returns</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900">Issued notes</h3>
                <p className="mt-1 text-sm text-slate-500">This list is backed by the financial note API and reflects return actions in real time.</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Note Number</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Party</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4">Reason</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {loading ? <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="inline animate-spin-slow"/></td></tr> :
                         notes.length === 0 ? <tr><td colSpan={6} className="py-10 text-center text-slate-500">No notes issued.</td></tr> :
                         notes.map(note => (
                            <tr key={note.id} className="hover:bg-slate-50/70">
                                <td className="px-6 py-4 font-bold text-slate-700">{note.noteNumber}</td>
                                <td className="px-6 py-4 text-slate-500">{note.date}</td>
                                <td className="px-6 py-4">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${note.type === 'Credit Note' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                        {note.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{note.partyName}</td>
                                <td className="px-6 py-4 text-right font-bold text-slate-700">₹{note.amount.toFixed(2)}</td>
                                <td className="px-6 py-4 text-slate-500">{note.reason}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default DebitCreditNotesView;
