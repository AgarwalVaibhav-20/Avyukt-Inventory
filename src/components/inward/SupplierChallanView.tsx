import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchGRNs } from '@/store/slices/procurementSlice';
import { Search, FileText, Paperclip, ExternalLink, Loader2, Download, AlertCircle, Filter } from 'lucide-react';

const SupplierChallanView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { grns, loading, error } = useAppSelector((state) => state.procurement);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchGRNs());
  }, [dispatch]);

  const filteredGRNs = grns.filter(g => 
    g.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.grnNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Challan / Invoice Repository</h1>
                <p className="text-sm text-slate-500">Centralized documentation for all supplier shipments and inward logistics.</p>
            </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by Challan, GRN, or Vendor Name..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 border-2 border-slate-50 bg-slate-50/50 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-medium"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors border border-slate-100">
                        <Filter size={16}/> Filter Range
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                        <Download size={16}/> Export Logs
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-5">Documentation Info</th>
                            <th className="px-6 py-5">GRN Mapping</th>
                            <th className="px-6 py-5">Vendor Details</th>
                            <th className="px-6 py-5">Receipt Date</th>
                            <th className="px-6 py-5">Sync Status</th>
                            <th className="px-6 py-5 text-right">Records</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                             <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto mb-2" size={32}/><p className="text-slate-400 font-bold">Scanning document repository...</p></td></tr>
                        ) : error ? (
                             <tr>
                                <td colSpan={6} className="py-20 text-center text-red-500">
                                    <AlertCircle className="mx-auto mb-2" size={32}/>
                                    <p className="font-bold tracking-tight">Sync Failure</p>
                                    <p className="text-[10px] uppercase font-bold">{error}</p>
                                </td>
                             </tr>
                        ) : filteredGRNs.length === 0 ? (
                             <tr><td colSpan={6} className="py-20 text-center text-slate-400 italic font-medium">No matching challans or invoices found.</td></tr>
                        ) : (
                            filteredGRNs.map(grn => (
                                <tr key={grn.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                <FileText size={20}/>
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-sm">{grn.challanNumber || 'N/A'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Supplier Document</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                            <span className="font-bold text-blue-600 font-mono text-xs">{grn.grnNumber}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-slate-700">{grn.vendorName}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">Active Partner</div>
                                    </td>
                                    <td className="px-6 py-5 text-slate-500 font-medium text-xs">{grn.date}</td>
                                    <td className="px-6 py-5">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            <CheckCircle className="w-3 h-3" /> System Mapped
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-black transition-all active:scale-95">
                                            <Paperclip size={14}/> View Invoice
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
        
        {/* Verification Summary */}
        {!loading && filteredGRNs.length > 0 && (
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                        <Paperclip size={24} className="text-blue-400" />
                    </div>
                    <div>
                        <p className="text-2xl font-black">{filteredGRNs.length}</p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Documents Verified</p>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <p className="text-sm font-bold text-emerald-400">100% Accuracy</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Audit Rating</p>
                    </div>
                    <button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">
                        Run Batch Audit
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

const CheckCircle = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
);

export default SupplierChallanView;
