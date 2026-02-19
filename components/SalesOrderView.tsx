import React, { useState, useEffect } from 'react';
import { salesService } from '../services/salesService';
import { productService } from '../services/productService';
import { SalesOrder, Customer, InventoryItem, SOItem } from '../types';
import { Plus, User, Calendar, Loader2 } from 'lucide-react';

const SalesOrderView: React.FC = () => {
  const [sos, setSOs] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newSO, setNewSO] = useState<{customerId: string, date: string, items: SOItem[]}>({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    items: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [soData, custData, itemData] = await Promise.all([
      salesService.getAllSOs(),
      salesService.getCustomers(),
      productService.getAllItems()
    ]);
    setSOs(soData);
    setCustomers(custData);
    setItems(itemData);
    setLoading(false);
  };

  const handleAddItem = () => {
    setNewSO({
        ...newSO,
        items: [...newSO.items, { itemId: '', itemName: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const updateItem = (index: number, field: keyof SOItem, value: any) => {
    const updatedItems = [...newSO.items];
    if (field === 'itemId') {
        const selectedItem = items.find(i => i.id === value);
        updatedItems[index] = {
            ...updatedItems[index],
            itemId: value,
            itemName: selectedItem?.name || '',
            unitPrice: selectedItem?.salePrice || 0
        };
    } else {
        // @ts-ignore
        updatedItems[index][field] = value;
    }
    setNewSO({ ...newSO, items: updatedItems });
  };

  const handleCreate = async () => {
    if (!newSO.customerId || newSO.items.length === 0) return alert("Please select customer and items");
    const customer = customers.find(c => c.id === newSO.customerId);
    
    const totalAmount = newSO.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    await salesService.createSO({
        customerId: newSO.customerId,
        customerName: customer?.name || '',
        date: newSO.date,
        totalAmount,
        items: newSO.items
    });
    
    setIsCreating(false);
    setNewSO({ customerId: '', date: new Date().toISOString().split('T')[0], items: [] });
    loadData();
  };

  return (
    <div className="space-y-6">
      {isCreating ? (
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-fade-in">
             <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-bold text-slate-800">Create Sales Order</h2>
                 <button onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-slate-700">Cancel</button>
             </div>
             
             <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                     <select 
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                        value={newSO.customerId}
                        onChange={e => setNewSO({...newSO, customerId: e.target.value})}
                     >
                        <option value="">Select Customer</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                     <input 
                        type="date" 
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                        value={newSO.date}
                        onChange={e => setNewSO({...newSO, date: e.target.value})}
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
                         {newSO.items.map((item, idx) => (
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
                    Generate Order
                 </button>
             </div>
         </div>
      ) : (
         <div className="flex justify-end">
             <button 
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
             >
                <Plus size={16} /> New Sales Order
             </button>
         </div>
      )}

      {/* SO List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-6 py-4 font-medium">SO Number</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin inline mr-2"/> Loading...</td></tr>
                ) : sos.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">No Sales Orders found.</td></tr>
                ) : (
                    sos.map((so) => (
                        <tr key={so.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-blue-600">{so.soNumber}</td>
                            <td className="px-6 py-4 flex items-center gap-2">
                                <User size={14} className="text-slate-400"/> {so.customerName}
                            </td>
                            <td className="px-6 py-4 text-slate-600">{so.date}</td>
                            <td className="px-6 py-4 font-medium">${so.totalAmount.toFixed(2)}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                    so.status === 'Dispatched' ? 'bg-green-50 text-green-700 border-green-100' :
                                    so.status === 'Confirmed' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    'bg-slate-50 text-slate-700 border-slate-100'
                                }`}>
                                    {so.status}
                                </span>
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

export default SalesOrderView;
