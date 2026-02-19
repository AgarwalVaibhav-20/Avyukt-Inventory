import React, { useState, useEffect } from 'react';
import { procurementService } from '../services/procurementService';
import { GRN } from '../types';
import { Search, FileText, Paperclip, ExternalLink, Loader2 } from 'lucide-react';

const SupplierChallanView: React.FC = () => {
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await procurementService.getAllGRNs();
    setGRNs(data);
    setLoading(false);
  };

  const filteredGRNs = grns.filter(g => 
    g.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.grnNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Supplier Challan / Invoice Mapping</h2>
                    <p className="text-sm text-slate-500">Map and verify supplier invoices against Goods Receipt Notes.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search Challan or Vendor..." 
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
                            <th className="px-6 py-4">Challan / Invoice No</th>
                            <th className="px-6 py-4">GRN Reference</th>
                            <th className="px-6 py-4">Vendor</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                             <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline mr-2"/> Loading...</td></tr>
                        ) : filteredGRNs.length === 0 ? (
                             <tr><td colSpan={6} className="py-8 text-center text-slate-500">No records found.</td></tr>
                        ) : (
                            filteredGRNs.map(grn => (
                                <tr key={grn.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                                        <FileText size={16} className="text-slate-400"/>
                                        {grn.challanNumber}
                                    </td>
                                    <td className="px-6 py-4 text-blue-600">{grn.grnNumber}</td>
                                    <td className="px-6 py-4 text-slate-600">{grn.vendorName}</td>
                                    <td className="px-6 py-4 text-slate-500">{grn.date}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            Mapped
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center justify-end gap-1 ml-auto">
                                            <Paperclip size={12}/> View Invoice
                                        </button>
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

export default SupplierChallanView;
