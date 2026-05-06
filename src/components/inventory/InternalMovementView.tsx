import React, { useState, useEffect } from 'react';
import { InventoryItem, Warehouse, InternalMovement } from '@/types';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createInternalMovementEntry, fetchStockMovementData } from '@/store/slices/stockMovementSlice';

const InternalMovementView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { internalMovements, items, warehouses, loading, actionLoading, error } = useAppSelector((state) => state.stockMovement);

  const [formData, setFormData] = useState({
      warehouseId: '',
      itemId: '',
      fromBin: '',
      toBin: '',
      quantity: 1,
      performedBy: 'Admin User'
  });

  useEffect(() => {
    dispatch(fetchStockMovementData());
  }, [dispatch]);

  const handleSubmit = async () => {
      if(!formData.warehouseId || !formData.itemId || !formData.fromBin || !formData.toBin) {
          return alert("Please fill all fields");
      }
      const selectedItem = items.find(i => i.id === formData.itemId);
      try {
          await dispatch(createInternalMovementEntry({
              ...formData,
              itemName: selectedItem?.name || 'Unknown'
          })).unwrap();
          alert("Movement Recorded!");
          setFormData({...formData, itemId: '', fromBin: '', toBin: '', quantity: 1});
      } catch(e) {
          alert("Failed");
      }
  };

  const typedMovements = internalMovements as InternalMovement[];
  const typedItems = items as InventoryItem[];
  const typedWarehouses = warehouses as Warehouse[];

  return (
    <div className="space-y-6">
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
           <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <ArrowRightLeft className="text-blue-600" size={20}/> Internal Movement (Bin-to-Bin)
           </h2>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                       {typedItems.map(i => <option key={i.id} value={i.id}>{i.sku} - {i.name}</option>)}
                   </select>
               </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">From Bin</label>
                   <input 
                     type="text" placeholder="e.g. A-01"
                     className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                     value={formData.fromBin}
                     onChange={e => setFormData({...formData, fromBin: e.target.value})}
                   />
               </div>
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">To Bin</label>
                   <input 
                     type="text" placeholder="e.g. B-05"
                     className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                     value={formData.toBin}
                     onChange={e => setFormData({...formData, toBin: e.target.value})}
                   />
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
                 className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
               >
                 {actionLoading ? <Loader2 className="animate-spin" size={16}/> : <ArrowRightLeft size={16}/>}
                 Record Movement
               </button>
           </div>
       </div>

       {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-4 border-b border-slate-200 bg-slate-50">
               <h3 className="font-semibold text-slate-800">Movement History</h3>
           </div>
           <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                   <tr>
                       <th className="p-3">Reference</th>
                       <th className="p-3">Date</th>
                       <th className="p-3">Item</th>
                       <th className="p-3">From</th>
                       <th className="p-3">To</th>
                       <th className="p-3 text-right">Qty</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                   {typedMovements.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-slate-500">No movements recorded</td></tr> : 
                    typedMovements.map(m => (
                       <tr key={m.id} className="hover:bg-slate-50">
                           <td className="p-3 font-medium">{m.reference}</td>
                           <td className="p-3 text-slate-500">{m.date}</td>
                           <td className="p-3">{m.itemName}</td>
                           <td className="p-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{m.fromBin}</span></td>
                           <td className="p-3"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{m.toBin}</span></td>
                           <td className="p-3 text-right font-medium">{m.quantity}</td>
                       </tr>
                   ))}
               </tbody>
           </table>
       </div>
    </div>
  );
};

export default InternalMovementView;
