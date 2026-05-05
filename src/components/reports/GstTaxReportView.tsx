import React, { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { GstReportItem } from '@/types';
import { Receipt, Download, Loader2 } from 'lucide-react';

const GstTaxReportView: React.FC = () => {
  const [data, setData] = useState<GstReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const res = await reportService.getGstReport();
    setData(res);
    setLoading(false);
  };

  const totalTax = data.reduce((acc, curr) => acc + curr.sgst + curr.cgst + curr.igst, 0);

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Receipt className="text-purple-600" size={20}/> GST Sales Register
                </h2>
                <div className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                    Total Tax Liability: <span className="text-purple-700">${totalTax.toLocaleString()}</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Invoice No</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4 text-right">Taxable Amt</th>
                            <th className="px-6 py-4 text-right">CGST</th>
                            <th className="px-6 py-4 text-right">SGST</th>
                            <th className="px-6 py-4 text-right">IGST</th>
                            <th className="px-6 py-4 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={8} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> : 
                         data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-700">{row.invoiceNo}</td>
                                <td className="px-6 py-4 text-slate-500">{row.date}</td>
                                <td className="px-6 py-4">{row.customerName}</td>
                                <td className="px-6 py-4 text-right">${row.taxableAmount.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right text-slate-600">${row.cgst.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right text-slate-600">${row.sgst.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right text-slate-600">${row.igst.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right font-bold text-purple-700">${row.totalAmount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default GstTaxReportView;
