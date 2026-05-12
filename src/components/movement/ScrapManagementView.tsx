import React, { useState, useEffect } from 'react';
import { InventoryItem, ScrapEntry } from '@/types';
import { Trash2, Loader2, Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createScrapMovementEntry, fetchStockMovementData } from '@/store/slices/stockMovementSlice';

const ScrapManagementView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { scrapEntries, items, actionLoading, error } = useAppSelector((state) => state.stockMovement);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
      itemId: '',
      quantity: 1,
      salvageValue: 0,
      reason: ''
  });

  useEffect(() => {
    dispatch(fetchStockMovementData());
  }, [dispatch]);

  const handleSubmit = async () => {
      if(!formData.itemId || !formData.reason) return alert("Fill all fields");
      const item = items.find(i => i.id === formData.itemId);
      try {
          await dispatch(createScrapMovementEntry({
              ...formData,
              itemName: item?.name || 'Unknown'
          })).unwrap();
          alert("Scrap entry recorded");
          setFormData({...formData, itemId: '', quantity: 1, salvageValue: 0, reason: ''});
      } catch(e) { alert("Error"); }
  };

  const typedItems = items as InventoryItem[];
  const typedScrapEntries = scrapEntries as ScrapEntry[];
  const filteredScrapEntries = typedScrapEntries.filter((entry) => {
      const term = searchTerm.trim().toLowerCase();
      return !term ||
          entry.reference.toLowerCase().includes(term) ||
          entry.itemName.toLowerCase().includes(term) ||
          entry.reason.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
           <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Trash2 className="text-red-600" size={20}/> Scrap & Disposal
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
               <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Item to Scrap</label>
                   <select 
                     className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                     value={formData.itemId}
                     onChange={e => setFormData({...formData, itemId: e.target.value})}
                   >
                       <option value="">Select Item</option>
                       {typedItems.map(i => <option key={i.id} value={i.id}>{i.sku} - {i.name} (${i.unitPrice})</option>)}
                   </select>
               </div>
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                   <input type="number" className="w-full border rounded-lg p-2 text-sm" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}/>
               </div>
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Salvage Value ($)</label>
                   <input type="number" className="w-full border rounded-lg p-2 text-sm" value={formData.salvageValue} onChange={e => setFormData({...formData, salvageValue: Number(e.target.value)})}/>
               </div>
           </div>
           <div className="mb-4">
               <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Disposal</label>
               <input type="text" className="w-full border rounded-lg p-2 text-sm" placeholder="e.g. Obsolete / Expired" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}/>
           </div>
           <div className="flex justify-end">
               <button onClick={handleSubmit} disabled={actionLoading} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2">
                   {actionLoading ? <Loader2 className="animate-spin" size={16}/> : <Trash2 size={16}/>} Scrap Item
               </button>
           </div>
       </div>

       {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="flex flex-col gap-3 border-b bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
               <h3 className="font-semibold text-slate-800">Scrap Register</h3>
               <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                   <div className="relative">
                       <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                       <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search ref, item, reason..." className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm md:w-72" />
                   </div>
                   <span className="text-xs text-slate-500">Total Salvage Value: ${filteredScrapEntries.reduce((acc, curr) => acc + curr.salvageValue, 0).toFixed(2)}</span>
               </div>
           </div>
           <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                   <tr>
                       <th className="p-3">Ref</th>
                       <th className="p-3">Date</th>
                       <th className="p-3">Item</th>
                       <th className="p-3">Qty</th>
                       <th className="p-3">Reason</th>
                       <th className="p-3 text-right">Salvage Value</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                   {filteredScrapEntries.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-slate-500">No scrap entries found.</td></tr> :
                   filteredScrapEntries.map(s => (
                       <tr key={s.id}>
                           <td className="p-3 font-medium">{s.reference}</td>
                           <td className="p-3 text-slate-500">{s.date}</td>
                           <td className="p-3">{s.itemName}</td>
                           <td className="p-3 font-bold text-red-600">{s.quantity}</td>
                           <td className="p-3 text-slate-600">{s.reason}</td>
                           <td className="p-3 text-right font-mono">${s.salvageValue.toFixed(2)}</td>
                       </tr>
                   ))}
               </tbody>
           </table>
       </div>
    </div>
  );
};

export default ScrapManagementView;
