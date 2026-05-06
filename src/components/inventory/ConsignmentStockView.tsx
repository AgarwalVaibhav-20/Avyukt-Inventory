import React, { useState, useEffect } from 'react';
import { InventoryItem, ConsignmentEntry } from '@/types';
import { Briefcase, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createConsignmentEntry, fetchStockMovementData } from '@/store/slices/stockMovementSlice';

const ConsignmentStockView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { consignments, items, actionLoading, error } = useAppSelector((state) => state.stockMovement);

  const [formData, setFormData] = useState({
      type: 'Outward' as 'Outward' | 'Inward',
      partyId: '',
      partyName: '',
      itemId: '',
      quantity: 1
  });

  useEffect(() => {
    dispatch(fetchStockMovementData());
  }, [dispatch]);

  const handleSubmit = async () => {
      if(!formData.partyName || !formData.itemId) return alert("Fill all fields");
      const item = items.find(i => i.id === formData.itemId);

      try {
          await dispatch(createConsignmentEntry({
              ...formData,
              itemName: item?.name || 'Unknown',
              partyName: formData.partyName
          })).unwrap();
          alert("Consignment Transferred");
          setFormData({...formData, itemId: '', quantity: 1, partyId: '', partyName: ''});
      } catch(e) { alert("Error"); }
  };

  const typedItems = items as InventoryItem[];
  const typedConsignments = consignments as ConsignmentEntry[];

  return (
    <div className="space-y-6">
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
           <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Briefcase className="text-blue-600" size={20}/> Consignment Stock Management
           </h2>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Direction</label>
                   <select 
                     className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                     value={formData.type}
                     onChange={e => setFormData({...formData, type: e.target.value as any})}
                   >
                       <option value="Outward">Outward (To Customer)</option>
                       <option value="Inward">Inward (Return from Customer)</option>
                   </select>
               </div>
               <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Party Name</label>
                   <input
                     type="text"
                     className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                     value={formData.partyName}
                     onChange={e => setFormData({...formData, partyName: e.target.value, partyId: e.target.value})}
                     placeholder={formData.type === 'Outward' ? 'Customer name' : 'Return party name'}
                   />
               </div>
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                   <input type="number" className="w-full border rounded-lg p-2 text-sm" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}/>
               </div>
           </div>
           
           <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Item</label>
              <select 
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                value={formData.itemId}
                onChange={e => setFormData({...formData, itemId: e.target.value})}
              >
                  <option value="">Select Item</option>
                  {typedItems.map(i => <option key={i.id} value={i.id}>{i.sku} - {i.name} (Held Consignment: {i.consignmentStock || 0})</option>)}
              </select>
           </div>

           <div className="flex justify-end">
               <button onClick={handleSubmit} disabled={actionLoading} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                   {actionLoading ? <Loader2 className="animate-spin" size={16}/> : <Briefcase size={16}/>} Process Transfer
               </button>
           </div>
       </div>

       {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-4 border-b bg-slate-50">
               <h3 className="font-semibold text-slate-800">Consignment Registry</h3>
           </div>
           <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                   <tr>
                       <th className="p-3">Ref</th>
                       <th className="p-3">Date</th>
                       <th className="p-3">Type</th>
                       <th className="p-3">Party</th>
                       <th className="p-3">Item</th>
                       <th className="p-3 text-right">Qty</th>
                       <th className="p-3 text-center">Status</th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                   {typedConsignments.map(c => (
                       <tr key={c.id}>
                           <td className="p-3 font-medium">{c.reference}</td>
                           <td className="p-3 text-slate-500">{c.date}</td>
                           <td className="p-3">
                               {c.type === 'Outward' 
                                 ? <span className="flex items-center gap-1 text-orange-600"><ArrowRight size={12}/> Out</span>
                                 : <span className="flex items-center gap-1 text-green-600"><ArrowLeft size={12}/> In</span>}
                           </td>
                           <td className="p-3">{c.partyName}</td>
                           <td className="p-3">{c.itemName}</td>
                           <td className="p-3 text-right font-bold">{c.quantity}</td>
                           <td className="p-3 text-center"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{c.status}</span></td>
                       </tr>
                   ))}
               </tbody>
           </table>
       </div>
    </div>
  );
};

export default ConsignmentStockView;
