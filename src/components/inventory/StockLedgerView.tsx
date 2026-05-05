import React, { useState, useEffect } from 'react';
import { stockControlService } from '@/services/stockControlService';
import { StockLedgerEntry } from '@/types';
import { History, Filter, Search, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const StockLedgerView: React.FC = () => {
  const [entries, setEntries] = useState<StockLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await stockControlService.getLedger();
    setEntries(data);
    setLoading(false);
  };

  const filtered = entries.filter(e => 
    e.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <History className="text-blue-600" size={20}/> Stock Ledger
                </h2>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search Item or Reference..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Item Details</th>
                            <th className="px-6 py-4">Transaction</th>
                            <th className="px-6 py-4">Ref No</th>
                            <th className="px-6 py-4 text-right">In / Out</th>
                            <th className="px-6 py-4 text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                             <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline mr-2"/> Loading Ledger...</td></tr>
                        ) : filtered.length === 0 ? (
                             <tr><td colSpan={6} className="py-8 text-center text-slate-500">No transactions found.</td></tr>
                        ) : (
                            filtered.map(entry => (
                                <tr key={entry.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-slate-500 font-mono">{entry.date}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{entry.itemName}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                            entry.quantityChange > 0 
                                            ? 'bg-green-50 text-green-700 border-green-100' 
                                            : 'bg-red-50 text-red-700 border-red-100'
                                        }`}>
                                            {entry.transactionType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{entry.reference}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${entry.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        <div className="flex items-center justify-end gap-1">
                                            {entry.quantityChange > 0 ? <ArrowDownLeft size={14}/> : <ArrowUpRight size={14}/>}
                                            {Math.abs(entry.quantityChange)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-700">
                                        {entry.runningBalance ?? '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default StockLedgerView;
