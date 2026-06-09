import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStockControlData } from '@/store/slices/stockControlSlice';
import { CalendarX, AlertTriangle, CheckCircle, Loader2, Search } from 'lucide-react';

const ExpiryTrackingView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { expiryBatches, loading, error } = useAppSelector((state) => state.stockControl);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    dispatch(fetchStockControlData());
  }, [dispatch]);

  const getStatus = (dateStr: string) => {
      const today = new Date();
      const expiry = new Date(dateStr);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if(diffDays < 0) return { label: 'Expired', color: 'text-red-600 bg-red-50', icon: CalendarX };
      if(diffDays < 30) return { label: 'Expiring Soon', color: 'text-amber-600 bg-amber-50', icon: AlertTriangle };
      return { label: 'Good', color: 'text-green-600 bg-green-50', icon: CheckCircle };
  };

  // Sort by nearest expiry
  const sortedBatches = [...expiryBatches]
      .filter((batch) => {
          const term = searchTerm.trim().toLowerCase();
          const status = getStatus(batch.expiryDate).label;
          const matchesSearch =
              !term ||
              batch.batchNumber.toLowerCase().includes(term) ||
              batch.itemName.toLowerCase().includes(term);
          const matchesStatus = statusFilter === 'All' || status === statusFilter;
          return matchesSearch && matchesStatus;
      })
      .sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <CalendarX className="text-red-500" size={20}/> Expiry Date Tracking
                </h2>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search batch or item..." className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm md:w-64" />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                        <option value="All">All Statuses</option>
                        <option value="Expired">Expired</option>
                        <option value="Expiring Soon">Expiring Soon</option>
                        <option value="Good">Good</option>
                    </select>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Batch Details</th>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4">Quantity</th>
                            <th className="px-6 py-4">Expiry Date</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> :
                         error ? <tr><td colSpan={5} className="py-8 text-center text-red-600">{error}</td></tr> :
                         sortedBatches.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-slate-500">No expiry batches found.</td></tr> :
                         sortedBatches.map(b => {
                             const status = getStatus(b.expiryDate);
                             const Icon = status.icon;
                             return (
                                <tr key={b.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-slate-700">{b.batchNumber}</td>
                                    <td className="px-6 py-4 font-medium">{b.itemName}</td>
                                    <td className="px-6 py-4">{b.quantity}</td>
                                    <td className="px-6 py-4 font-medium">{b.expiryDate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                                            <Icon size={14}/> {status.label}
                                        </span>
                                    </td>
                                </tr>
                             );
                         })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default ExpiryTrackingView;
