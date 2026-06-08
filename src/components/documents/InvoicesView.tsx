import React, { useState, useEffect } from 'react';
import { documentService } from '@/services/documentService';
import { salesService } from '@/services/salesService';
import { Invoice, SalesOrder } from '@/types';
import { FileText, Plus, Printer, Loader2, Search } from 'lucide-react';
import { useListControls } from '@/hooks/useListControls';
import Pagination from '@/components/common/Pagination';

const InvoicesView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pendingSOs, setPendingSOs] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSOId, setSelectedSOId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'earliest'>('newest');

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

      const baseAmount = so.totalAmount || 0;
      const tax = baseAmount * 0.18; // Mock 18% Tax
      
      await documentService.createInvoice({
          soId: so.id,
          soNumber: so.soNumber,
          customerName: so.customerName,
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], // +30 days
          totalAmount: baseAmount + tax,
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

  const {
    filteredItems,
    pagedItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
  } = useListControls({
    items: invoices,
    searchTerm: search,
    filters: { statusFilter, sortOrder },
    searchFn: (inv, term) =>
      (inv.invoiceNumber || '').toLowerCase().includes(term) ||
      (inv.customerName || '').toLowerCase().includes(term) ||
      (inv.soNumber || '').toLowerCase().includes(term),
    filterFn: (inv, filters) => filters.statusFilter === 'All' || inv.status === filters.statusFilter,
  });

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="text-blue-600" size={20}/> Customer Invoices
                </h2>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices..." className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm sm:w-64" />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                        <option value="All">All Statuses</option>
                        {[...new Set(invoices.map((inv) => inv.status).filter(Boolean))].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'newest' | 'earliest')} className="rounded-lg border px-3 py-2 text-sm">
                        <option value="newest">Newest first</option>
                        <option value="earliest">Earliest first</option>
                    </select>
                    <button onClick={() => setIsCreating(!isCreating)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex gap-2">
                        <Plus size={16}/> Generate Invoice
                    </button>
                </div>
            </div>

            {isCreating && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6 animate-fade-in flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-blue-800 mb-1">Select Dispatched Order</label>
                        <select className="w-full border rounded p-2 text-sm" value={selectedSOId} onChange={e => setSelectedSOId(e.target.value)}>
                            <option value="">-- Choose Order --</option>
                            {pendingSOs.map(s => <option key={s.id} value={s.id}>{s.soNumber} - {s.customerName} (₹{s.totalAmount})</option>)}
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
                        {loading ? <tr><td colSpan={7} className="py-8 text-center"><Loader2 className="animate-spin-slow inline"/></td></tr> :
                         filteredItems.length === 0 ? <tr><td colSpan={7} className="py-8 text-center text-slate-500">No invoices found.</td></tr> :
                         pagedItems.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-800">{inv.invoiceNumber}</td>
                                <td className="px-6 py-4 text-slate-500">{inv.date}</td>
                                <td className="px-6 py-4">{inv.customerName}</td>
                                <td className="px-6 py-4 text-slate-500 text-xs">{inv.soNumber}</td>
                                <td className="px-6 py-4 text-right font-medium">₹{(inv.totalAmount || 0).toFixed(2)}</td>
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
            <Pagination currentPage={page} totalPages={totalPages} pageSize={pageSize} totalItems={totalItems} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
    </div>
  );
};

export default InvoicesView;
