import React, { useState, useEffect } from 'react';
import { returnsService } from '@/services/returnsService';
import { FinancialNote } from '@/types';
import { Banknote, Loader2 } from 'lucide-react';

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

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Banknote className="text-green-600" size={20}/> Financial Notes (Returns)
            </h2>

            <div className="overflow-x-auto">
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
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> :
                         notes.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-500">No notes issued.</td></tr> :
                         notes.map(note => (
                            <tr key={note.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-700">{note.noteNumber}</td>
                                <td className="px-6 py-4 text-slate-500">{note.date}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${note.type === 'Credit Note' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                        {note.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{note.partyName}</td>
                                <td className="px-6 py-4 text-right font-bold text-slate-700">${note.amount.toFixed(2)}</td>
                                <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{note.reason}</td>
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
