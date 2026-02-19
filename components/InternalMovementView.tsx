import React, { useState, useEffect } from 'react';
import { movementService } from '../services/movementService';
import { productService } from '../services/productService';
import { warehouseService } from '../services/warehouseService';
import { InventoryItem, Warehouse, InternalMovement } from '../types';
import { ArrowRightLeft, MapPin, Loader2, ArrowRight } from 'lucide-react';

const InternalMovementView: React.FC = () => {
  const [movements, setMovements] = useState<InternalMovement[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
      warehouseId: '',
      itemId: '',
      fromBin: '',
      toBin: '',
      quantity: 1,
      performedBy: 'Admin User'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [mvData, iData, wData] = await Promise.all([
        movementService.getInternalMovements(),
        productService.getAllItems(),
        warehouseService.getAllWarehouses()
    ]);
    setMovements(mvData);
    setItems(iData);
    setWarehouses(wData);
    setLoading(false);
  };

  const handleSubmit = async () => {
      if(!formData.warehouseId || !formData.itemId || !formData.fromBin || !formData.toBin) {
          return alert("Please fill all fields");
      }
      setSubmitting(true);
      const selectedItem = items.find(i => i.id === formData.itemId);
      try {
          await movementService.createInternalMovement({
              ...formData,
              itemName: selectedItem?.name || 'Unknown'
          });
          alert("Movement Recorded!");
          setFormData({...formData, itemId: '', fromBin: '', toBin: '', quantity: 1});
          loadData();
      } catch(e) {
          alert("Failed");
      } finally {
          setSubmitting(false);
      }
  };

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
                       {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
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
                       {items.map(i => <option key={i.id} value={i.id}>{i.sku} - {i.name}</option>)}
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
                 disabled={submitting}
                 className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
               >
                 {submitting ? <Loader2 className="animate-spin" size={16}/> : <ArrowRightLeft size={16}/>}
                 Record Movement
               </button>
           </div>
       </div>

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
                   {movements.length === 0 ? <tr><td colSpan={6} className="p-4 text-center text-slate-500">No movements recorded</td></tr> : 
                    movements.map(m => (
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
