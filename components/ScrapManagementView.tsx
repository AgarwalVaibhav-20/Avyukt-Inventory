import React, { useState, useEffect } from 'react';
import { movementService } from '../services/movementService';
import { productService } from '../services/productService';
import { InventoryItem, ScrapEntry } from '../types';
import { Trash2, DollarSign, Loader2 } from 'lucide-react';

const ScrapManagementView: React.FC = () => {
  const [scrapList, setScrapList] = useState<ScrapEntry[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
      itemId: '',
      quantity: 1,
      salvageValue: 0,
      reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      const [sData, iData] = await Promise.all([
          movementService.getScrapEntries(),
          productService.getAllItems()
      ]);
      setScrapList(sData);
      setItems(iData);
  };

  const handleSubmit = async () => {
      if(!formData.itemId || !formData.reason) return alert("Fill all fields");
      setSubmitting(true);
      const item = items.find(i => i.id === formData.itemId);
      try {
          await movementService.createScrapEntry({
              ...formData,
              itemName: item?.name || 'Unknown'
          });
          alert("Scrap Entry Recorded. Stock Deducted.");
          setFormData({...formData, itemId: '', quantity: 1, salvageValue: 0, reason: ''});
          loadData();
      } catch(e) { alert("Error"); } finally { setSubmitting(false); }
  };

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
                       {items.map(i => <option key={i.id} value={i.id}>{i.sku} - {i.name} (${i.unitPrice})</option>)}
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
               <button onClick={handleSubmit} disabled={submitting} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2">
                   {submitting ? <Loader2 className="animate-spin" size={16}/> : <Trash2 size={16}/>} Scrap Item
               </button>
           </div>
       </div>

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-4 border-b bg-slate-50 flex justify-between">
               <h3 className="font-semibold text-slate-800">Scrap Register</h3>
               <span className="text-xs text-slate-500">Total Salvage Value: ${scrapList.reduce((acc, curr) => acc + curr.salvageValue, 0).toFixed(2)}</span>
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
                   {scrapList.map(s => (
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
