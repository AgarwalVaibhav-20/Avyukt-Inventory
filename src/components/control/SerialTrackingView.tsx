import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createSerialRecord, fetchStockControlData } from '@/store/slices/stockControlSlice';
import { ScanBarcode, MapPin, Plus, Loader2, Search } from 'lucide-react';
import { useListControls } from '@/hooks/useListControls';
import Pagination from '@/components/common/Pagination';

const SerialTrackingView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { serials, items, loading, actionLoading, error } = useAppSelector((state) => state.stockControl);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [newSerial, setNewSerial] = useState({ itemId: '', serialNumber: '', currentLocation: 'Warehouse A' });

  useEffect(() => {
    dispatch(fetchStockControlData());
  }, [dispatch]);

  const handleAdd = async () => {
      if(!newSerial.itemId || !newSerial.serialNumber) return;
      const item = items.find(i => i.id === newSerial.itemId);
      await dispatch(createSerialRecord({
          ...newSerial,
          itemName: item?.name || 'Unknown',
          sku: item?.sku || '',
      })).unwrap();
      setIsAdding(false);
      setNewSerial({ itemId: '', serialNumber: '', currentLocation: 'Warehouse A' });
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
    items: serials,
    searchTerm,
    filters: { statusFilter, locationFilter },
    searchFn: (serial, term) =>
      (serial.serialNumber || '').toLowerCase().includes(term) ||
      (serial.itemName || '').toLowerCase().includes(term) ||
      (serial.sku || '').toLowerCase().includes(term),
    filterFn: (serial, filters) =>
      (filters.statusFilter === 'All' || serial.status === filters.statusFilter) &&
      (filters.locationFilter === 'All' || serial.currentLocation === filters.locationFilter),
  });

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <ScanBarcode className="text-indigo-600" size={20}/> Serial Number Tracking
                </h2>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search serial, item, SKU..." className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm sm:w-64" />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                        <option value="All">All Statuses</option>
                        {[...new Set(serials.map((serial) => serial.status).filter(Boolean))].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                        <option value="All">All Locations</option>
                        {[...new Set(serials.map((serial) => serial.currentLocation).filter(Boolean))].map((location) => <option key={location} value={location}>{location}</option>)}
                    </select>
                    <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
                        <Plus size={16}/> Register Serial
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6 flex flex-col md:flex-row gap-4 items-end animate-fade-in">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-indigo-800 mb-1">Item</label>
                        <select className="w-full border rounded p-2 text-sm" value={newSerial.itemId} onChange={e => setNewSerial({...newSerial, itemId: e.target.value})}>
                            <option value="">Select Item</option>
                            {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
                        </select>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-indigo-800 mb-1">Serial Number</label>
                        <input type="text" className="w-full border rounded p-2 text-sm" placeholder="SN-XXXX" value={newSerial.serialNumber} onChange={e => setNewSerial({...newSerial, serialNumber: e.target.value})}/>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-indigo-800 mb-1">Location</label>
                        <input type="text" className="w-full border rounded p-2 text-sm" value={newSerial.currentLocation} onChange={e => setNewSerial({...newSerial, currentLocation: e.target.value})}/>
                    </div>
                    <button onClick={handleAdd} disabled={actionLoading} className="bg-indigo-600 text-white px-6 py-2 rounded text-sm hover:bg-indigo-700 h-10 disabled:opacity-60">
                        {actionLoading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            )}

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Serial Number</th>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Location</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={4} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> :
                         filteredItems.length === 0 ? <tr><td colSpan={4} className="py-8 text-center text-slate-500">No serials tracked.</td></tr> :
                         pagedItems.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-mono font-medium text-indigo-600">{s.serialNumber}</td>
                                <td className="px-6 py-4">{s.itemName}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        s.status === 'Available' ? 'bg-green-100 text-green-700' : 
                                        s.status === 'Sold' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 flex items-center gap-1">
                                    <MapPin size={14}/> {s.currentLocation}
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

export default SerialTrackingView;
