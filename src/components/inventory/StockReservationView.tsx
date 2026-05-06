import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  createReservationRecord,
  fetchStockControlData,
  releaseReservationRecord,
} from '@/store/slices/stockControlSlice';
import { Lock, Unlock, Plus, Loader2 } from 'lucide-react';

const StockReservationView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { reservations, items, loading, actionLoading, error } = useAppSelector((state) => state.stockControl);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ itemId: '', quantity: 1, reference: '', expiryDate: '' });

  useEffect(() => {
    dispatch(fetchStockControlData());
  }, [dispatch]);

  const handleCreate = async () => {
      if(!form.itemId || !form.reference) return alert("Fill required fields");
      const item = items.find(i => i.id === form.itemId);
      await dispatch(createReservationRecord({
          ...form,
          itemName: item?.name || 'Unknown',
          reservedDate: new Date().toISOString().split('T')[0],
          sku: item?.sku || '',
      })).unwrap();
      setIsAdding(false);
      setForm({ itemId: '', quantity: 1, reference: '', expiryDate: '' });
  };

  const handleRelease = async (id: string) => {
      if(confirm("Release this stock reservation?")) {
          await dispatch(releaseReservationRecord(id)).unwrap();
      }
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Lock className="text-amber-600" size={20}/> Stock Reservations
                </h2>
                <button onClick={() => setIsAdding(!isAdding)} className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 text-sm font-medium flex gap-2 items-center">
                    <Plus size={16}/> Reserve Stock
                </button>
            </div>

            {isAdding && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-amber-900 mb-1">Item</label>
                            <select className="w-full border rounded p-2 text-sm" value={form.itemId} onChange={e => setForm({...form, itemId: e.target.value})}>
                                <option value="">Select Item</option>
                                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku}) - Available: {i.stock}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-amber-900 mb-1">Quantity</label>
                            <input type="number" className="w-full border rounded p-2 text-sm" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-amber-900 mb-1">Expiry (Auto-Release)</label>
                            <input type="date" className="w-full border rounded p-2 text-sm" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})}/>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-amber-900 mb-1">Reference (SO / Project)</label>
                        <input type="text" className="w-full border rounded p-2 text-sm" placeholder="e.g. SO-2023-999" value={form.reference} onChange={e => setForm({...form, reference: e.target.value})}/>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleCreate} disabled={actionLoading} className="bg-amber-600 text-white px-6 py-2 rounded text-sm hover:bg-amber-700 disabled:opacity-60">
                            {actionLoading ? 'Saving...' : 'Confirm Reservation'}
                        </button>
                    </div>
                </div>
            )}

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            <div className="grid gap-4">
                {loading ? <div className="text-center py-8"><Loader2 className="animate-spin inline"/></div> :
                 reservations.length === 0 ? <p className="text-center text-slate-500 py-8">No active reservations.</p> :
                 reservations.map(res => (
                    <div key={res.id} className="border border-slate-200 rounded-lg p-4 flex justify-between items-center bg-white hover:shadow-sm">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-800">{res.reference}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${res.status === 'Active' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                                    {res.status}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600">{res.quantity} x {res.itemName}</p>
                            <p className="text-xs text-slate-400 mt-1">Expires: {res.expiryDate || 'N/A'}</p>
                        </div>
                        {res.status === 'Active' && (
                            <button onClick={() => handleRelease(res.id)} className="text-slate-400 hover:text-red-600 p-2" title="Release Reservation">
                                <Unlock size={20}/>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default StockReservationView;
