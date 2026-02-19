import React, { useState, useEffect } from 'react';
import { salesService } from '../services/salesService';
import { SalesOrder } from '../types';
import { FileText, Paperclip, Loader2 } from 'lucide-react';

const CustomerInvoiceView: React.FC = () => {
  const [dispatchedSOs, setDispatchedSOs] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const sos = await salesService.getAllSOs();
    setDispatchedSOs(sos.filter(s => s.status === 'Dispatched' || s.status === 'Delivered'));
    setLoading(false);
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Customer Invoice Mapping</h2>
            <p className="text-sm text-slate-500 mb-6">Link generated system invoices to dispatched orders.</p>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">SO Number</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Invoice Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                             <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline mr-2"/> Loading...</td></tr>
                        ) : dispatchedSOs.length === 0 ? (
                             <tr><td colSpan={6} className="py-8 text-center text-slate-500">No dispatched orders found.</td></tr>
                        ) : (
                            dispatchedSOs.map(so => (
                                <tr key={so.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-blue-600">{so.soNumber}</td>
                                    <td className="px-6 py-4">{so.customerName}</td>
                                    <td className="px-6 py-4 text-slate-500">{so.date}</td>
                                    <td className="px-6 py-4 font-medium">${so.totalAmount}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            Generated
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

export default CustomerInvoiceView;
