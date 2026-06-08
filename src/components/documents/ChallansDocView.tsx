import React, { useState, useEffect } from 'react';
import { salesService } from '@/services/salesService';
import { DeliveryChallan } from '@/types';
import { FileText, Printer, Loader2, Search } from 'lucide-react';
import { useListControls } from '@/hooks/useListControls';
import Pagination from '@/components/common/Pagination';

const ChallansDocView: React.FC = () => {
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await salesService.getChallans();
    setChallans(data);
    setLoading(false);
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
    items: challans,
    searchTerm: search,
    filters: { statusFilter },
    searchFn: (dc, term) =>
      (dc.challanNumber || '').toLowerCase().includes(term) ||
      (dc.customerName || '').toLowerCase().includes(term) ||
      (dc.soNumber || '').toLowerCase().includes(term),
    filterFn: (dc, filters) => filters.statusFilter === 'All' || dc.status === filters.statusFilter,
  });

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="text-indigo-600" size={20}/> Delivery Challans
                </h2>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search challans..." className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm sm:w-64" />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                        <option value="All">All Statuses</option>
                        {[...new Set(challans.map((dc) => dc.status).filter(Boolean))].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Challan #</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">SO Reference</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin-slow inline"/></td></tr> :
                         filteredItems.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-500">No challans found.</td></tr> :
                         pagedItems.map(dc => (
                            <tr key={dc.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-800">{dc.challanNumber}</td>
                                <td className="px-6 py-4 text-slate-500">{dc.date}</td>
                                <td className="px-6 py-4">{dc.customerName}</td>
                                <td className="px-6 py-4 text-slate-500">{dc.soNumber}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                                        {dc.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => alert("Printing DC...")} className="text-slate-400 hover:text-indigo-600">
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

export default ChallansDocView;
