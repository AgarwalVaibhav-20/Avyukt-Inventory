import React, { useState, useEffect } from 'react';
import { InventoryItem, Warehouse, StockAdjustment, AdjustmentType } from '@/types';
import { AlertOctagon, Settings2, Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createStockAdjustmentEntry, fetchStockMovementData } from '@/store/slices/stockMovementSlice';

const StockAdjustmentView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { adjustments, items, warehouses, actionLoading, error } = useAppSelector((state) => state.stockMovement);

  const [formData, setFormData] = useState({
      warehouseId: '',
      itemId: '',
      type: 'Damage' as AdjustmentType,
      quantity: 1,
      reason: ''
  });

  useEffect(() => {
    dispatch(fetchStockMovementData());
  }, [dispatch]);

  const handleSubmit = async () => {
      if(!formData.warehouseId || !formData.itemId || !formData.reason) return alert("Fill all fields");
      const item = items.find(i => i.id === formData.itemId);
      try {
          await dispatch(createStockAdjustmentEntry({
              ...formData,
              itemName: item?.name || 'Unknown'
          })).unwrap();
          alert("Adjustment submitted successfully");
          setFormData({...formData, itemId: '', quantity: 1, reason: ''});
      } catch(e) {
          alert("Error");
      }
  };

  const isDeduction = ['Damage', 'Loss', 'Theft'].includes(formData.type);
  const typedItems = items as InventoryItem[];
  const typedWarehouses = warehouses as Warehouse[];
  const typedAdjustments = adjustments as StockAdjustment[];

  return (
    <div className="space-y-6">
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
           <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Settings2 className="text-blue-600" size={20}/> Stock Adjustment / Correction
           </h2>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                   <select 
                     className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                     value={formData.type}
                     onChange={e => setFormData({...formData, type: e.target.value as AdjustmentType})}
                   >
                       <option value="Damage">Damage</option>
                       <option value="Loss">Loss / Missing</option>
                       <option value="Theft">Theft</option>
                       <option value="Correction">Inventory Correction</option>
                       <option value="Found">Stock Found</option>
                   </select>
                   <p className={`text-xs mt-1 ${isDeduction ? 'text-red-500' : 'text-green-500'}`}>
                       Impact: {isDeduction ? 'Deduct from Stock' : 'Add/Adjust Stock'}
                   </p>
               </div>
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Note</label>
                   <input 
                     type="text" 
                     className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                     value={formData.reason}
                     onChange={e => setFormData({...formData, reason: e.target.value})}
                     placeholder="e.g. Water damage during leak"
                   />
               </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Warehouse</label>
                   <select 
                     className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                     value={formData.warehouseId}
                     onChange={e => setFormData({...formData, warehouseId: e.target.value})}
                   >
                       <option value="">Select Warehouse</option>
                       {typedWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                   </select>
               </div>
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Item</label>
                   <select 
                     className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                     value={formData.itemId}
                     onChange={e => setFormData({...formData, itemId: e.target.value})}
                   >
                       <option value="">Select Item</option>
                       {typedItems.map(i => <option key={i.id} value={i.id}>{i.sku} - {i.name} (Qty: {i.stock})</option>)}
                   </select>
               </div>
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                   <input 
                     type="number"
                     className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                     value={formData.quantity}
                     onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                   />
               </div>
           </div>

           <div className="flex justify-end">
               <button 
                 onClick={handleSubmit}
                 disabled={actionLoading}
                 className={`px-6 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-2 ${isDeduction ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
               >
                 {actionLoading ? <Loader2 className="animate-spin" size={16}/> : <AlertOctagon size={16}/>}
                 Confirm Adjustment
               </button>
           </div>
       </div>

       {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-4 border-b border-slate-200 bg-slate-50">
               <h3 className="font-semibold text-slate-800">Adjustment Log</h3>
           </div>
           <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                   <tr>
                       <th className="p-3">Ref</th>
                       <th className="p-3">Date</th>
                       <th className="p-3">Item</th>
                       <th className="p-3">Type</th>
                       <th className="p-3">Reason</th>
                       <th className="p-3 text-right">Impact</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                   {typedAdjustments.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-slate-500">No logs found</td></tr> : 
                    typedAdjustments.map(a => (
                       <tr key={a.id} className="hover:bg-slate-50">
                           <td className="p-3 font-medium">{a.reference}</td>
                           <td className="p-3 text-slate-500">{a.date}</td>
                           <td className="p-3">{a.itemName}</td>
                           <td className="p-3">
                               <span className={`px-2 py-0.5 rounded text-xs border ${a.impact === 'Deduct' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                   {a.type}
                               </span>
                           </td>
                           <td className="p-3 text-slate-500 truncate max-w-xs">{a.reason}</td>
                           <td className="p-3 text-right font-bold">
                               <div className={`flex items-center justify-end gap-1 ${a.impact === 'Deduct' ? 'text-red-600' : 'text-green-600'}`}>
                                   {a.impact === 'Deduct' ? <ArrowDownCircle size={14}/> : <ArrowUpCircle size={14}/>}
                                   {a.quantity}
                               </div>
                           </td>
                       </tr>
                   ))}
               </tbody>
           </table>
       </div>
    </div>
  );
};

export default StockAdjustmentView;
