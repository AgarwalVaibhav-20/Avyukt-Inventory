import React, { useState, useEffect } from 'react';
import { movementService } from '../services/movementService';
import { productService } from '../services/productService';
import { salesService } from '../services/salesService';
import { procurementService } from '../services/procurementService';
import { InventoryItem, Customer, Vendor, ConsignmentEntry } from '../types';
import { Briefcase, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

const ConsignmentStockView: React.FC = () => {
  const [consignments, setConsignments] = useState<ConsignmentEntry[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
      type: 'Outward' as 'Outward' | 'Inward',
      partyId: '',
      itemId: '',
      quantity: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      const [cData, iData, custData, vendData] = await Promise.all([
          movementService.getConsignmentEntries(),
          productService.getAllItems(),
          salesService.getCustomers(),
          procurementService.getVendors()
      ]);
      setConsignments(cData);
      setItems(iData);
      setCustomers(custData);
      setVendors(vendData);
  };

  const handleSubmit = async () => {
      if(!formData.partyId || !formData.itemId) return alert("Fill all fields");
      setSubmitting(true);
      const item = items.find(i => i.id === formData.itemId);
      const partyName = formData.type === 'Outward' 
        ? customers.find(c => c.id === formData.partyId)?.name 
        : vendors.find(v => v.id === formData.partyId)?.name;

      try {
          await movementService.createConsignment({
              ...formData,
              itemName: item?.name || 'Unknown',
              partyName: partyName || 'Unknown'
          });
          alert("Consignment Transferred");
          setFormData({...formData, itemId: '', quantity: 1, partyId: ''});
          loadData();
      } catch(e) { alert("Error"); } finally { setSubmitting(false); }
  };

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
                   <label className="block text-sm font-medium text-slate-700 mb-1">Customer / Vendor</label>
                   <select 
                     className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                     value={formData.partyId}
                     onChange={e => setFormData({...formData, partyId: e.target.value})}
                   >
                       <option value="">Select Party</option>
                       {customers.map(c => <option key={c.id} value={c.id}>{c.name} (Customer)</option>)}
                   </select>
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
                  {items.map(i => <option key={i.id} value={i.id}>{i.sku} - {i.name} (Held Consignment: {i.consignmentStock || 0})</option>)}
              </select>
           </div>

           <div className="flex justify-end">
               <button onClick={handleSubmit} disabled={submitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                   {submitting ? <Loader2 className="animate-spin" size={16}/> : <Briefcase size={16}/>} Process Transfer
               </button>
           </div>
       </div>

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
                   {consignments.map(c => (
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
