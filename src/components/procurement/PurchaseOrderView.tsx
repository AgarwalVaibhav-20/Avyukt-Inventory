import React, { useState, useEffect } from 'react';
import { procurementService } from '@/services/procurementService';
import { productService } from '@/services/productService';
import { PurchaseOrder, Vendor, InventoryItem, POItem } from '@/types';
import { Plus, FileText, Calendar, User, Loader2, Check } from 'lucide-react';

const PurchaseOrderView: React.FC = () => {
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newPO, setNewPO] = useState<{vendorId: string, date: string, items: POItem[]}>({
    vendorId: '',
    date: new Date().toISOString().split('T')[0],
    items: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [poData, vendorData, itemData] = await Promise.all([
      procurementService.getAllPOs(),
      procurementService.getVendors(),
      productService.getAllItems()
    ]);
    setPOs(poData);
    setVendors(vendorData);
    setItems(itemData);
    setLoading(false);
  };

  const handleAddItem = () => {
    setNewPO({
        ...newPO,
        items: [...newPO.items, { itemId: '', itemName: '', quantity: 1, unitPrice: 0, receivedQty: 0 }]
    });
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const updatedItems = [...newPO.items];
    if (field === 'itemId') {
        const selectedItem = items.find(i => i.id === value);
        updatedItems[index] = {
            ...updatedItems[index],
            itemId: value,
            itemName: selectedItem?.name || '',
            unitPrice: selectedItem?.unitPrice || 0
        };
    } else {
        // @ts-ignore
        updatedItems[index][field] = value;
    }
    setNewPO({ ...newPO, items: updatedItems });
  };

  const handleCreate = async () => {
    if (!newPO.vendorId || newPO.items.length === 0) return alert("Please select vendor and items");
    const vendor = vendors.find(v => v.id === newPO.vendorId);
    
    // Calc total
    const totalAmount = newPO.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    await procurementService.createPO({
        vendorId: newPO.vendorId,
        vendorName: vendor?.name || '',
        date: newPO.date,
        expectedDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], // +7 days
        totalAmount,
        items: newPO.items
    });
    
    setIsCreating(false);
    setNewPO({ vendorId: '', date: new Date().toISOString().split('T')[0], items: [] });
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Create Modal overlay could go here, but using inline for simplicity or toggle */}
      {isCreating ? (
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-fade-in">
             <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-bold text-slate-800">Create New Purchase Order</h2>
                 <button onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-slate-700">Cancel</button>
             </div>
             
             <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
                     <select 
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                        value={newPO.vendorId}
                        onChange={e => setNewPO({...newPO, vendorId: e.target.value})}
                     >
                        <option value="">Select Vendor</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                     </select>
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Order Date</label>
                     <input 
                        type="date" 
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                        value={newPO.date}
                        onChange={e => setNewPO({...newPO, date: e.target.value})}
                     />
                 </div>
             </div>

             <div className="mb-4">
                 <div className="flex justify-between items-center mb-2">
                     <h3 className="font-semibold text-slate-700 text-sm">Items</h3>
                     <button onClick={handleAddItem} className="text-xs text-blue-600 hover:underline">+ Add Item</button>
                 </div>
                 <table className="w-full text-sm text-left border rounded-lg overflow-hidden">
                     <thead className="bg-slate-50 text-slate-500">
                         <tr>
                             <th className="p-2">Item</th>
                             <th className="p-2 w-24">Qty</th>
                             <th className="p-2 w-24">Price</th>
                             <th className="p-2 w-24">Total</th>
                         </tr>
                     </thead>
                     <tbody>
                         {newPO.items.map((item, idx) => (
                             <tr key={idx} className="border-t">
                                 <td className="p-2">
                                     <select 
                                        className="w-full border border-slate-200 rounded p-1"
                                        value={item.itemId}
                                        onChange={e => updateItem(idx, 'itemId', e.target.value)}
                                     >
                                        <option value="">Select Item</option>
                                        {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                     </select>
                                 </td>
                                 <td className="p-2">
                                     <input 
                                        type="number" className="w-full border border-slate-200 rounded p-1"
                                        value={item.quantity}
                                        onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                                     />
                                 </td>
                                 <td className="p-2">
                                     <input 
                                        type="number" className="w-full border border-slate-200 rounded p-1"
                                        value={item.unitPrice}
                                        onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))}
                                     />
                                 </td>
                                 <td className="p-2 text-right">
                                     ${(item.quantity * item.unitPrice).toFixed(2)}
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>

             <div className="flex justify-end">
                 <button 
                    onClick={handleCreate}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                 >
                    Confirm Order
                 </button>
             </div>
         </div>
      ) : (
         <div className="flex justify-end">
             <button 
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
             >
                <Plus size={16} /> Create Purchase Order
             </button>
         </div>
      )}

      {/* PO List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-6 py-4 font-medium">PO Number</th>
                    <th className="px-6 py-4 font-medium">Vendor</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Items</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline mr-2"/> Loading...</td></tr>
                ) : pos.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-500">No Purchase Orders found.</td></tr>
                ) : (
                    pos.map((po) => (
                        <tr key={po.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-blue-600">{po.poNumber}</td>
                            <td className="px-6 py-4 flex items-center gap-2">
                                <User size={14} className="text-slate-400"/> {po.vendorName}
                            </td>
                            <td className="px-6 py-4 text-slate-600">{po.date}</td>
                            <td className="px-6 py-4 font-medium">${po.totalAmount.toFixed(2)}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                    po.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' :
                                    po.status === 'Sent' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    'bg-slate-50 text-slate-700 border-slate-100'
                                }`}>
                                    {po.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                                {po.items.length} Items
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderView;
