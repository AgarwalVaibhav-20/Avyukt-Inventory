import React, { useState, useEffect } from 'react';
import { vendorService } from '@/services/vendorService';
import { Vendor } from '@/types';
import { ShieldCheck, Loader2, Star, Phone, Mail, Search } from 'lucide-react';
import Pagination from '@/components/common/Pagination';
import { useListControls } from '@/hooks/useListControls';

const ApprovedVendorListView: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await vendorService.getVendors();
    setVendors(data);
    setLoading(false);
  };

  const {
    filteredItems: filteredVendors,
    pagedItems: pagedVendors,
    page,
    totalItems,
    totalPages,
    setPage,
  } = useListControls({
    items: vendors,
    searchTerm: search,
    initialPageSize: 8,
    searchFn: (vendor, term) =>
      vendor.name.toLowerCase().includes(term) ||
      vendor.code.toLowerCase().includes(term) ||
      (vendor.contactPerson || '').toLowerCase().includes(term) ||
      (vendor.email || '').toLowerCase().includes(term) ||
      (vendor.phone || '').toLowerCase().includes(term),
    filterFn: (vendor) => vendor.status === 'Active',
  });

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <ShieldCheck className="text-green-600" size={20}/> Approved Vendor List (AVL)
                    </h2>
                    <p className="text-sm text-slate-500">List of vetted and active suppliers authorized for procurement.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search vendor, code, contact, email..."
                        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-green-500"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Vendor</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Rating</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> :
                         filteredVendors.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-slate-500">No active vendors.</td></tr> :
                         pagedVendors.map(v => (
                            <tr key={v.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800">{v.name}</p>
                                    <p className="text-xs text-slate-500">{v.code}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-slate-700">{v.contactPerson}</p>
                                    <div className="flex gap-3 text-xs text-slate-400 mt-1">
                                        <span className="flex items-center gap-1"><Mail size={10}/> {v.email}</span>
                                        <span className="flex items-center gap-1"><Phone size={10}/> {v.phone}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 text-amber-500 font-medium">
                                        <Star size={14} fill="currentColor"/> {v.rating.toFixed(1)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{v.category}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                                        <ShieldCheck size={12}/> Approved
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalItems > 0 && totalPages > 1 && (
                <div className="mt-6">
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            )}
        </div>
    </div>
  );
};

export default ApprovedVendorListView;
