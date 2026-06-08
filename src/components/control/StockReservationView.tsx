import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  createReservationRecord,
  fetchStockControlData,
  releaseReservationRecord,
  updateReservationRecord,
  deleteReservationRecord,
} from '@/store/slices/stockControlSlice';
import { 
    Lock, Unlock, Plus, Loader2, Search, Filter, Calendar, 
    ShieldCheck, Box, User, Hash, AlertTriangle, CheckCircle2,
    Clock, ArrowRight, X, ChevronRight, Edit3, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const StockReservationView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { reservations, items, loading, actionLoading, error } = useAppSelector((state) => state.stockControl);
  const { salesOrders } = useAppSelector((state) => state.outward);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [expiryFilter, setExpiryFilter] = useState('');
  const [form, setForm] = useState({ itemId: '', quantity: 1, reference: '', expiryDate: '' });

  useEffect(() => {
    dispatch(fetchStockControlData());
  }, [dispatch]);

  const handleCreateOrUpdate = async () => {
      if(!form.itemId || !form.reference) return toast.error("Please fill mandatory fields");
      const item = items.find(i => i.id === form.itemId);
      
      // If creating new, check stock
      if(!editingId && item && form.quantity > item.stock) {
          return toast.error("Reservation quantity exceeds available stock");
      }

      try {
          if (editingId) {
              await dispatch(updateReservationRecord({
                  id: editingId,
                  data: {
                      ...form,
                      itemName: item?.name || 'Unknown',
                      sku: item?.sku || '',
                  }
              })).unwrap();
              toast.success("Reservation updated");
          } else {
              await dispatch(createReservationRecord({
                  ...form,
                  itemName: item?.name || 'Unknown',
                  reservedDate: new Date().toISOString().split('T')[0],
                  sku: item?.sku || '',
              })).unwrap();
              toast.success("Stock reserved successfully");
          }
          resetForm();
      } catch (err: any) {
          toast.error(err || "Failed to save reservation");
      }
  };

  const resetForm = () => {
      setIsAdding(false);
      setEditingId(null);
      setForm({ itemId: '', quantity: 1, reference: '', expiryDate: '' });
  };

  const startEdit = (res: any) => {
      setEditingId(res.id);
      setForm({
          itemId: res.itemId,
          quantity: res.quantity,
          reference: res.reference,
          expiryDate: res.expiryDate,
      });
      setIsAdding(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRelease = async (id: string) => {
      if(confirm("Are you sure you want to release this stock back to general inventory?")) {
          try {
              await dispatch(releaseReservationRecord(id)).unwrap();
              toast.success("Stock released");
          } catch (err: any) {
              toast.error("Failed to release stock");
          }
      }
  };

  const handleDelete = async (id: string) => {
      if(confirm("Permanently delete this reservation record? This cannot be undone.")) {
          try {
              await dispatch(deleteReservationRecord(id)).unwrap();
              toast.success("Record deleted");
          } catch (err: any) {
              toast.error("Failed to delete record");
          }
      }
  };

  const filteredReservations = reservations.filter(r => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
          !term ||
          r.reference.toLowerCase().includes(term) ||
          r.itemName.toLowerCase().includes(term) ||
          (r.sku || '').toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchesExpiry = !expiryFilter || r.expiryDate === expiryFilter;
      return matchesSearch && matchesStatus && matchesExpiry;
  });

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
        {/* Modern Header */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Lock size={160} className="text-amber-600"/>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-inner">
                        <ShieldCheck className="text-amber-600" size={32}/>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Stock Reservations</h2>
                        <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                            Inventory isolation for confirmed Sales Orders & Projects
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => isAdding ? resetForm() : setIsAdding(true)} 
                    className={`px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all ${
                        isAdding ? 'bg-slate-100 text-slate-600' : 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-200'
                    }`}
                >
                    {isAdding ? <><X size={20}/> Cancel</> : <><Plus size={20}/> New Reservation</>}
                </button>
            </div>
        </div>

        {isAdding && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2.5rem] border border-amber-100 p-10 shadow-2xl animate-in slide-in-from-top-8 duration-500">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                        <Lock className="text-amber-600" size={20}/>
                    </div>
                    <h3 className="text-xl font-black text-amber-900 uppercase tracking-tight">
                        {editingId ? 'Edit Reservation' : 'Inventory Lock Protocol'}
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-amber-800/60 uppercase tracking-widest ml-1">Reference (SO / Order #)</label>
                        <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" size={16}/>
                            <select 
                                className="w-full bg-white border border-amber-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-4 focus:ring-amber-500/10 outline-none transition-all shadow-sm appearance-none"
                                value={form.reference}
                                onChange={e => setForm({...form, reference: e.target.value})}
                            >
                                <option value="">Select SO Ref</option>
                                {salesOrders.map(so => <option key={so.id} value={so.soNumber}>{so.soNumber} - {so.customerName}</option>)}
                                <option value="Manual">Manual Entry</option>
                            </select>
                            {form.reference === 'Manual' && (
                                <input 
                                    type="text" 
                                    placeholder="Enter Custom Reference" 
                                    className="mt-3 w-full bg-white border border-amber-200 rounded-2xl px-4 py-4 text-sm font-bold shadow-sm outline-none"
                                    onChange={e => setForm({...form, reference: e.target.value})}
                                />
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 lg:col-span-1">
                        <label className="block text-xs font-black text-amber-800/60 uppercase tracking-widest ml-1">Target Item</label>
                        <div className="relative">
                            <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" size={16}/>
                            <select 
                                className="w-full bg-white border border-amber-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-4 focus:ring-amber-500/10 outline-none transition-all shadow-sm" 
                                value={form.itemId} 
                                onChange={e => setForm({...form, itemId: e.target.value})}
                            >
                                <option value="">Select SKU</option>
                                {items.map(i => <option key={i.id} value={i.id}>{i.name} (ATP: {i.stock})</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-black text-amber-800/60 uppercase tracking-widest ml-1">Quantity to Lock</label>
                        <input 
                            type="number" 
                            className="w-full bg-white border border-amber-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-amber-500/10 outline-none transition-all shadow-sm" 
                            value={form.quantity} 
                            onChange={e => setForm({...form, quantity: Number(e.target.value)})}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-black text-amber-800/60 uppercase tracking-widest ml-1">Auto-Release Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" size={16}/>
                            <input 
                                type="date" 
                                className="w-full bg-white border border-amber-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-4 focus:ring-amber-500/10 outline-none transition-all shadow-sm" 
                                value={form.expiryDate} 
                                onChange={e => setForm({...form, expiryDate: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-amber-200/50 pt-8">
                    <div className="flex items-center gap-4 text-amber-800/70 text-xs font-bold">
                        <AlertTriangle size={16}/>
                        Reserved stock will be excluded from Available-to-Promise (ATP) calculations.
                    </div>
                    <div className="flex gap-4">
                        <button onClick={resetForm} className="px-8 py-4 rounded-2xl font-black text-sm text-amber-800 hover:bg-amber-100 transition-all">Discard</button>
                        <button 
                            onClick={handleCreateOrUpdate} 
                            disabled={actionLoading} 
                            className="bg-amber-600 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-amber-700 shadow-xl shadow-amber-200/50 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {actionLoading ? <Loader2 className="animate-spin-slow" size={20}/> : <ShieldCheck size={20}/>}
                            {editingId ? 'Save Changes' : 'Confirm Reservation'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                    <input 
                        type="text" 
                        placeholder="Search by SKU or SO Ref..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-amber-500/10 transition-all outline-none"
                    />
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowFilters((current) => !current)}
                        className={`p-4 rounded-2xl transition-colors ${showFilters ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500 hover:text-amber-600'}`}
                        title="Toggle filters"
                    >
                        <Filter size={20}/>
                    </button>
                </div>
            </div>
            {showFilters && (
                <div className="mb-8 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-3">
                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 outline-none"
                    >
                        <option value="All">All Statuses</option>
                        {[...new Set(reservations.map((res) => res.status).filter(Boolean))].map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input
                            type="date"
                            value={expiryFilter}
                            onChange={(event) => setExpiryFilter(event.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-600 outline-none"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('All');
                            setExpiryFilter('');
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-500 hover:bg-slate-100"
                    >
                        Clear Filters
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <Loader2 className="animate-spin-slow text-amber-600 mb-4" size={48}/>
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Querying Reserved Ledger...</p>
                </div>
            ) : filteredReservations.length === 0 ? (
                <div className="text-center py-24 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                    <Lock className="mx-auto text-slate-200 mb-4" size={64}/>
                    <p className="text-slate-400 font-bold italic">No active stock reservations found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReservations.map(res => (
                        <div key={res.id} className="group relative bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-amber-100/50 hover:border-amber-200 transition-all duration-300">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                                        <Lock size={10}/> Priority Reservation
                                    </span>
                                    <h4 className="text-xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">{res.reference}</h4>
                                </div>
                                <div className="flex gap-2">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                        res.status === 'Active' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                    }`}>
                                        {res.status}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(res)} className="p-2 bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-all"><Edit3 size={14}/></button>
                                        <button onClick={() => handleDelete(res.id)} className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-500">
                                        <Box size={20}/>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Stock Item</p>
                                        <p className="font-black text-slate-800 truncate">{res.itemName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Qty</p>
                                        <p className="font-black text-amber-600 text-lg">{res.quantity}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 px-1">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Reserved On</p>
                                        <p className="text-xs font-black text-slate-700 flex items-center gap-1.5"><Clock size={12}/> {res.reservedDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Expires On</p>
                                        <p className="text-xs font-black text-rose-600 flex items-center gap-1.5"><AlertTriangle size={12}/> {res.expiryDate || 'PERPETUAL'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {res.status === 'Active' ? (
                                    <button 
                                        onClick={() => handleRelease(res.id)} 
                                        className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-xs hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Unlock size={14}/> Release Stock
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleDelete(res.id)}
                                        className="flex-1 bg-slate-50 text-slate-400 py-3 rounded-xl font-black text-xs hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100 uppercase tracking-widest"
                                    >
                                        Delete Record
                                    </button>
                                )}
                                <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
                                    <ChevronRight size={18}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default StockReservationView;
