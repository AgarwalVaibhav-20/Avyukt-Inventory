import React, { useState, useEffect } from 'react';
import { documentService } from '@/services/documentService';
import { salesService } from '@/services/salesService';
import { Invoice, SalesOrder } from '@/types';
import { FileText, Plus, Printer, Loader2 } from 'lucide-react';

const InvoicesView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pendingSOs, setPendingSOs] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSOId, setSelectedSOId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [invData, soData] = await Promise.all([
        documentService.getInvoices(),
        salesService.getAllSOs()
    ]);
    setInvoices(invData);
    // Find SOs that are Dispatched but don't have an Invoice yet
    const invoicedSoIds = new Set(invData.map(i => i.soId));
    setPendingSOs(soData.filter(s => s.status === 'Dispatched' && !invoicedSoIds.has(s.id)));
    setLoading(false);
  };

  const handleCreate = async () => {
      if(!selectedSOId) return;
      const so = pendingSOs.find(s => s.id === selectedSOId);
      if(!so) return;

      const tax = so.totalAmount * 0.18; // Mock 18% Tax
      
      await documentService.createInvoice({
          soId: so.id,
          soNumber: so.soNumber,
          customerName: so.customerName,
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], // +30 days
          totalAmount: so.totalAmount + tax,
          taxAmount: tax,
          status: 'Sent',
          items: so.items
      });
      
      setIsCreating(false);
      setSelectedSOId('');
      loadData();
  };

  const printInvoice = (inv: Invoice) => {
      alert(`Printing Invoice ${inv.invoiceNumber}...`);
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="text-blue-600" size={20}/> Customer Invoices
                </h2>
                <button onClick={() => setIsCreating(!isCreating)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex gap-2">
                    <Plus size={16}/> Generate Invoice
                </button>
            </div>

            {isCreating && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6 animate-fade-in flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-blue-800 mb-1">Select Dispatched Order</label>
                        <select className="w-full border rounded p-2 text-sm" value={selectedSOId} onChange={e => setSelectedSOId(e.target.value)}>
                            <option value="">-- Choose Order --</option>
                            {pendingSOs.map(s => <option key={s.id} value={s.id}>{s.soNumber} - {s.customerName} (${s.totalAmount})</option>)}
                        </select>
                    </div>
                    <button onClick={handleCreate} disabled={!selectedSOId} className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 h-10 disabled:opacity-50">Generate</button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Invoice #</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Ref SO</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={7} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> :
                         invoices.length === 0 ? <tr><td colSpan={7} className="py-8 text-center text-slate-500">No invoices generated.</td></tr> :
                         invoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-800">{inv.invoiceNumber}</td>
                                <td className="px-6 py-4 text-slate-500">{inv.date}</td>
                                <td className="px-6 py-4">{inv.customerName}</td>
                                <td className="px-6 py-4 text-slate-500 text-xs">{inv.soNumber}</td>
                                <td className="px-6 py-4 text-right font-medium">${inv.totalAmount.toFixed(2)}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => printInvoice(inv)} className="text-slate-400 hover:text-blue-600">
                                        <Printer size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default InvoicesView;
